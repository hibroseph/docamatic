// Notes stay above site elements added later with the same top z-index.
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, backgroundReady, extensionWorker, notesShown } from "../env.mjs";

const URL3 = "http://localhost:8765/fb.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (name, ok, detail = "") => console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  pipe: true,
  userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"],
});
const extId = await browser.installExtension(EXT); await backgroundReady(browser);
await sleep(1500);
const ext = await browser.newPage();
await ext.goto(`chrome-extension://${extId}/options.html`);
const sw = await (await extensionWorker(browser));
await sw.evaluate(async (data) => { await chrome.storage.local.clear(); await chrome.storage.local.set(data); }, {
  pages: { [URL3]: { notes: [{ id: "A", position: { x: 700, y: 200 }, size: { width: 240 }, title: "A", body: "body", date_created: Date.now() - 86400000, color: { title: "#fff1a3", text: "#1e2433", name: "yellow" }, visible: true }] } },
  tags: [],
  metadata: { onboarded: true, schema_version: 1, analytics_enabled: false },
});
await browser.installExtension(EXT); await backgroundReady(browser);
await sleep(1000);

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto(URL3); await notesShown(page);
await sleep(1800);

// What's on top at a point in the note (the notes' layer shows as its host element)
const topAt = () => page.evaluate(() => document.elementFromPoint(760, 260)?.tagName.toLowerCase());
const addPopup = () => page.evaluate(() => {
  const el = document.createElement("div");
  el.className = "fb-popup";
  el.style.cssText = "position:fixed;left:600px;top:150px;width:400px;height:300px;background:#333;z-index:2147483647";
  document.body.appendChild(el);
});

check("note on top at first", (await topAt()) === "docamatic-notes", await topAt());
await addPopup();
await sleep(200);
check("a popup added later with the same z-index doesn't cover the note", (await topAt()) === "docamatic-notes", await topAt());
check("layer is last in <body>", await page.evaluate(() => document.body.lastElementChild.tagName === "DOCAMATIC-NOTES"));

// Typing in the note when a popup arrives: the cursor stays, the layer waits
const cdp = await page.createCDPSession();
const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
let bodyNode = null;
const walk = (node) => {
  if (node.attributes && node.attributes.includes("note-body")) bodyNode = node;
  for (const c of [...(node.children || []), ...(node.shadowRoots || [])]) walk(c);
};
walk(root);
const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: bodyNode.backendNodeId });
await page.mouse.click(model.border[0] + 20, model.border[1] + 10);
await page.keyboard.type("typing ");
await addPopup();
await sleep(200);
await page.keyboard.type("still typing");
const focused = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
check("while typing, the cursor stays in the note", focused === "docamatic-notes", focused);
check("and the layer waits", await page.evaluate(() => document.body.lastElementChild.className === "fb-popup"));
await page.mouse.click(300, 700);
await sleep(300);
check("after leaving the note, it's on top again", (await topAt()) === "docamatic-notes", await topAt());

// A page script that also insists on being last: no endless back and forth
const moves = await page.evaluate(async () => {
  const mine = document.createElement("div");
  mine.style.cssText = "position:fixed;left:600px;top:150px;width:10px;height:10px;z-index:2147483647";
  document.body.appendChild(mine);
  let count = 0;
  new MutationObserver(() => {
    if (document.body.lastElementChild !== mine && count < 500) {
      count++;
      document.body.appendChild(mine);
    }
  }).observe(document.body, { childList: true });
  document.body.appendChild(document.createElement("span"));
  await new Promise((r) => setTimeout(r, 1500));
  return count;
});
check("a script fighting for the last spot: Docamatic backs off", moves < 40, `${moves} moves by the page`);

await browser.close();
