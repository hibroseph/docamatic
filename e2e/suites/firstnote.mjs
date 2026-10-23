// First steps: the welcome page's "Add my first note" (a note on a real page,
// here a local stand-in for Wikipedia), the tip in a new note, the popup's
// pointer to the board once there are a few notes, and All notes' link to the
// board.
import puppeteer from "puppeteer-core";
import https from "node:https";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, notesShown } from "../env.mjs";
import { TLS } from "../tls.mjs";

const PAGE = "https://en.wikipedia.org/wiki/Post-it_note";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg, detail = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}${detail ? ` (${detail})` : ""}`);
};

// Stands in for Wikipedia: Chrome is pointed here instead
const server = https.createServer({ key: TLS.key, cert: TLS.cert }, (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><title>Post-it note - Wikipedia</title><h1>Post-it note</h1>${"<p>A Post-it note is a small piece of paper with a re-adherable strip of glue on its back.</p>".repeat(20)}`);
});
await new Promise((r) => server.listen(8444, r));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  pipe: true,
  userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    "--host-resolver-rules=MAP en.wikipedia.org 127.0.0.1:8444, MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"],
});

// Elements by test id, inside the notes' closed shadow root too
const findTestIds = async (page) => {
  const cdp = await page.createCDPSession();
  const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
  const found = new Map();
  const walk = (node) => {
    const attributes = node.attributes || [];
    for (let i = 0; i < attributes.length; i += 2) if (attributes[i] === "data-testid") found.set(attributes[i + 1], node);
    [...(node.children || []), ...(node.shadowRoots || [])].forEach(walk);
  };
  walk(root);
  return { found, cdp };
};
const clickTestId = async (page, testId) => {
  const { found, cdp } = await findTestIds(page);
  const node = found.get(testId);
  if (!node) return false;
  const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: node.backendNodeId });
  const q = model.content;
  await page.mouse.click((q[0] + q[4]) / 2, (q[1] + q[5]) / 2);
  return true;
};

try {
  await backgroundReady(browser);
  const sw = await extensionWorker(browser);
  const extId = sw.url().split("/")[2];
  const stored = () => sw.evaluate(async () => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })));

  // ---- The welcome page's first note
  const welcome = await browser.newPage();
  await welcome.setViewport({ width: 1280, height: 860 });
  await welcome.goto(`chrome-extension://${extId}/onboarding.html`);
  await sleep(800);
  const opened = browser.waitForTarget((t) => t.url() === PAGE, { timeout: 10000 });
  await welcome.click('[data-testid="onboarding-first-note"]');
  const page = await (await opened).page();
  await page.setViewport({ width: 1280, height: 800 });
  check(await notesShown(page), "Add my first note opens the page with a note on it");
  await welcome.waitForFunction(() => /Done/.test(document.getElementById("first-status").textContent), { timeout: 10000 }).catch(() => {});
  check(/Done/.test(await welcome.$eval("#first-status", (el) => el.textContent)), "the welcome page says it's done");
  await sleep(800);
  const notes = Object.values((await stored()).pages || {}).flatMap((p) => p.notes);
  check(notes.length === 1 && notes[0].title === "My first note" && /Click here to write/.test(notes[0].body || ""), "the note has its title and what to do next", JSON.stringify(notes.map((n) => n.title)));

  // ---- A web page gets only its own notes, never storage
  const fromPage = await sw.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        try {
          return Object.keys(await chrome.storage.local.get(null)).length;
        } catch (err) {
          return `refused: ${err.message}`;
        }
      },
    });
    return result.result;
  }, PAGE);
  check(String(fromPage).startsWith("refused"), "content scripts can't read storage", String(fromPage));

  // ---- The tip in a new note
  await page.bringToFront();
  await sleep(500);
  check((await findTestIds(page)).found.has("note-hint"), "the new note shows the first-time tip");
  await page.screenshot({ path: `${OUT}/firstnote-tip.png` });
  check(await clickTestId(page, "note-hint-dismiss"), "it has Got it");
  await sleep(800);
  check(!(await findTestIds(page)).found.has("note-hint"), "Got it puts the tip away");
  check((await stored()).metadata?.hints?.first_note === true, "and it's remembered");

  // A later new note: no tip
  const tabId = await sw.evaluate(async (url) => (await chrome.tabs.query({ url }))[0]?.id, PAGE);
  const popup = await browser.newPage();
  await popup.setViewport({ width: 380, height: 600 });
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await sleep(600);
  for (let i = 0; i < 2; i++) {
    const result = await popup.evaluate((tabId) => chrome.runtime.sendMessage({ type: "create_note", tabId, placement: "page", source: "popup" }), tabId);
    check(result?.ok === true, `another note added (${i + 2})`);
    await sleep(600);
  }
  await sleep(600);
  check(!(await findTestIds(page)).found.has("note-hint"), "notes made later don't show the tip");

  // ---- The popup's pointer to the board, with 3 notes
  await popup.reload();
  await sleep(1000);
  check(await popup.$('[data-testid="board-hint"]').then(Boolean), "with 3 notes the popup points at the board");
  await popup.screenshot({ path: `${OUT}/firstnote-board-hint.png` });
  const boardOpened = browser.waitForTarget((t) => t.url().endsWith("/board.html?from=hint"), { timeout: 5000 }).then(() => true, () => false);
  await popup.click('[data-testid="board-hint-open"]').catch(() => {});
  check(await boardOpened, "Open the board opens it");
  await sleep(1500);
  check((await stored()).metadata?.hints?.board === true, "opening the board puts the pointer away for good");
  const popup2 = await browser.newPage();
  await popup2.goto(`chrome-extension://${extId}/popup.html`);
  await sleep(1000);
  check(!(await popup2.$('[data-testid="board-hint"]')), "the popup doesn't show it again");

  // ---- All notes links to the board
  await popup2.click('[data-testid="popup-nav-sort"]').catch(() => {});
  await sleep(500);
  check(await popup2.$('[data-testid="all-notes-open-board"]').then(Boolean), "All notes has a link to the board");
  await popup2.screenshot({ path: `${OUT}/firstnote-all-notes.png` });
} finally {
  await browser.close();
  server.close();
}
console.log(fails ? `${fails} FAILED` : "all passed");
