// 5.1: when a note can't go on the page, the popup offers to reload and retry,
// or to keep the note in Docamatic instead
import https from "node:https";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, launchChrome, notesShown } from "../env.mjs";
import { TLS } from "../tls.mjs";
const WEB = "http://localhost:8765/article.html";
const STORE = "https://chromewebstore.google.com/detail/some-extension/abcdefghijklmnopabcdefghijklmnop";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const store = https.createServer({ key: TLS.key, cert: TLS.cert }, (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<title>Some extension - Chrome Web Store</title><h1>Some extension</h1>");
}).listen(8445);
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "rec-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--ignore-certificate-errors",
    "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1, MAP chromewebstore.google.com 127.0.0.1:8445"] });
const id = (await browser.waitForTarget((t) => t.url().startsWith("chrome-extension://"))).url().split("/")[2];
const stored = async () => { const p = await browser.newPage(); await p.goto(`chrome-extension://${id}/popup.html`); const s = await p.evaluate(() => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }))); await p.close(); return s.pages || {}; };
// The popup acts on the active tab; opened as a tab here, so point it at `url`
const openPopup = async (url, { failFirst } = {}) => {
  const popup = await browser.newPage();
  await popup.setViewport({ width: 380, height: 600 });
  await popup.evaluateOnNewDocument((url, failFirst) => {
    const query = chrome.tabs.query.bind(chrome.tabs);
    chrome.tabs.query = (info) => query({ url: url.split("#")[0] + "*" }).then((tabs) => tabs.slice(0, 1));
    if (failFirst) {
      const send = chrome.runtime.sendMessage.bind(chrome.runtime);
      let failed = false;
      chrome.runtime.sendMessage = (message, ...rest) => {
        if (message?.type && /create/i.test(message.type) && !failed) { failed = true; return Promise.resolve({ ok: false, reason: failFirst }); }
        return send(message, ...rest);
      };
    }
  }, url, failFirst || null);
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await sleep(1200);
  return popup;
};
try {
  await sleep(1500);
  // ---- Reload and try again
  const web = await browser.newPage();
  await web.goto(WEB); await notesShown(web);
  await sleep(1500);
  await web.evaluate(() => (window.__beforeReload = true));
  let popup = await openPopup(WEB, { failFirst: "page_unresponsive" });
  await popup.click('[data-testid="popup-nav-new"]');
  await sleep(600);
  const box = await popup.$eval('[data-testid="popup-create-failure"]', (e) => e.innerText).catch(() => "");
  console.log("failure box:", JSON.stringify(box));
  check(/Couldn't put a note on this page/.test(box), "it says the note couldn't go on the page");
  check(Boolean(await popup.$('[data-testid="popup-retry-after-reload"]')) && Boolean(await popup.$('[data-testid="popup-keep-note-instead"]')), "and offers both: reload and try again, or keep it here");
  await popup.screenshot({ path: `${OUT}/recover-failure.png` });
  const closed = new Promise((resolve) => popup.once("close", () => resolve(true)));
  await popup.click('[data-testid="popup-retry-after-reload"]');
  const didClose = await Promise.race([closed, sleep(15000).then(() => false)]);
  await sleep(1200); // the background saves half a second after a change
  check(await web.evaluate(() => window.__beforeReload !== true), "the page was reloaded");
  const afterRetry = Object.values(await stored()).flatMap((p) => p.notes);
  check(afterRetry.length === 1 && afterRetry[0].visible !== false, `after reloading the note goes on the page (${afterRetry.length})`);
  check(didClose, "and the popup gets out of the way, as after any new note");

  // ---- Keep a note here instead, on a page no extension can touch
  const storeTab = await browser.newPage();
  await storeTab.goto(STORE);
  await sleep(1000);
  popup = await openPopup(STORE);
  const empty = await popup.evaluate(() => document.querySelector(".content")?.innerText || "");
  check(/keep a note about it/.test(empty), "This page says notes can't go on the page, but one can be kept");
  await popup.click('[data-testid="popup-nav-new"]');
  await sleep(800);
  const box2 = await popup.$eval('[data-testid="popup-create-failure"]', (e) => e.innerText).catch(() => "");
  console.log("failure box:", JSON.stringify(box2));
  check(/can't go on this page/.test(box2), "on the Web Store it explains notes can't go there");
  check(!(await popup.$('[data-testid="popup-retry-after-reload"]')) && Boolean(await popup.$('[data-testid="popup-keep-note-instead"]')), "no reload offered (it wouldn't help), but it can be kept here");
  await popup.screenshot({ path: `${OUT}/recover-store.png` });
  await popup.click('[data-testid="popup-keep-note-instead"]');
  await sleep(1200);
  const focused = await popup.evaluate(() => document.activeElement?.closest?.('[data-testid="note"]')?.getAttribute("data-note-id") || document.activeElement?.tagName);
  await popup.keyboard.type("Compare reviews before installing");
  await sleep(1000);
  await popup.screenshot({ path: `${OUT}/recover-kept.png` });
  const pages = await stored();
  const kept = Object.entries(pages).find(([url]) => url.includes("chromewebstore"));
  console.log("kept:", JSON.stringify(kept?.[1].notes.map((n) => ({ title: n.title, visible: n.visible }))), "focused:", focused);
  check(Boolean(kept) && kept[1].notes[0].visible === false, "the note is saved with that page, kept in Docamatic");
  check(JSON.stringify(kept?.[1].notes[0]).includes("Compare reviews"), "and it can be written right away in the popup");
  const listed = await popup.$$eval('[data-testid="note"]', (els) => els.length);
  check(listed === 1, `it's listed under This page (${listed})`);
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); store.close(); }
