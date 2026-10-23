// Typing in a note on a page with its own keyboard shortcuts: the note gets
// every key, the site's shortcuts don't fire, and they work again outside it.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
const URL = "http://localhost:8765/shortcuts.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await launchChrome({
  executablePath: CHROME,
  headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
try {
  // Loaded once (--load-extension): reinstalling here would leave two
  // workers that both answer the new note request (two notes, focus lost)
  await backgroundReady(browser);
  const extId = (await extensionWorker(browser)).url().split("/")[2];
  await sleep(1500);
  const ext = await browser.newPage();
  await ext.goto(`chrome-extension://${extId}/options.html`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(URL); await notesShown(page);
  await sleep(1500);
  const tabId = await ext.evaluate(async (url) => (await chrome.tabs.query({ url }))[0].id, URL);
  const created = await ext.evaluate((tabId) => chrome.runtime.sendMessage({ type: "create_note", tabId, placement: "page", source: "popup" }), tabId);
  await page.bringToFront();
  await sleep(1200);
  const text = "secret keys everywhere";
  await page.keyboard.type(text, { delay: 10 });
  await page.keyboard.press("Enter");
  await page.keyboard.type("e", { delay: 10 });
  await sleep(1200);
  const saved = (await ext.evaluate(async () => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })))).pages;
  const note = Object.values(saved).flatMap((p) => p.notes).find((n) => n.id === created.noteId);
  const got = (note?.body || "").replace(/<[^>]+>/g, "");
  check(got.startsWith(text) && got.replace(/|/g, "").endsWith("e"), `typing in note: saved "${got}"`);
  check((await page.evaluate(() => window.shortcutHits.length)) === 0, `site saw no keys: ${await page.evaluate(() => JSON.stringify(window.shortcutHits))}`);
  // Focus the page, keys go to the site
  await page.mouse.click(600, 500);
  await sleep(300);
  await page.keyboard.type("e");
  await sleep(300);
  const hits = await page.evaluate(() => window.shortcutHits);
  check(hits.includes("e"), `page focused: site got key ${JSON.stringify(hits)}`);
  // Escape/Enter inside note still handled: open menu, add tag with Enter
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
