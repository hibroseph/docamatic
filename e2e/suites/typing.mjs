// Fast typing into a brand-new (empty) note: does every character land in order?
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, backgroundReady, notesShown } from "../env.mjs";

const ARTICLE = "http://localhost:8765/article.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"],
});
try {
  const extId = await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1500);
  const ext = await browser.newPage();
  await ext.goto(`chrome-extension://${extId}/options.html`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(ARTICLE); await notesShown(page);
  await sleep(1500);
  let failures = 0;
  for (let round = 1; round <= 4; round++) {
    const tabId = await ext.evaluate(async (url) => (await chrome.tabs.query({ url }))[0].id, ARTICLE);
    const created = await ext.evaluate((tabId) => chrome.runtime.sendMessage({ type: "create_note", tabId, placement: "page", source: "popup" }), tabId);
    await page.bringToFront();
    await sleep(1200);
    // The new note's text field has the cursor; type fast, no delay between keys
    const text = "Hello quick typing " + round;
    await page.keyboard.type(text, { delay: round % 2 ? 0 : 15 });
    await sleep(1200);
    const saved = (await ext.evaluate(async () => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })))).pages;
    const note = Object.values(saved).flatMap((p) => p.notes).find((n) => n.id === created.noteId);
    const got = (note?.body || "").replace(/<[^>]+>/g, "");
    const ok = got === text;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} round ${round}: typed "${text}", saved "${got}"`);
  }
  console.log(failures ? `${failures} FAILED` : "all typed text landed in order");
} finally {
  await browser.close();
}
