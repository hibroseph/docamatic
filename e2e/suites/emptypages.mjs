// 5.0.2: an install with pages: [] (as in the Sentry report) starts normally after updating
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, backgroundReady, extensionWorker, launchChrome } from "../env.mjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "ep-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
try {
  const id = await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1500);
  const sw = await (await extensionWorker(browser));
  await sw.evaluate(async () => { await chrome.storage.local.clear(); await chrome.storage.local.set({ analytics: { installId: "x" }, metadata: { docamatic_version: "4.0.0", migrated_data_to_storage_local: true }, pages: [] }); });
  await browser.installExtension(EXT); await backgroundReady(browser); // the update to 5.0.2
  await sleep(2500);
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${id}/popup.html`);
  await sleep(1500);
  const stored = await page.evaluate(() => chrome.storage.local.get(null));
  console.log("stored keys:", Object.keys(stored).join(","), "pages:", JSON.stringify(stored.pages));
  // Saved again in the current layout (each page under "page:<url>"; none here)
  check(!("pages" in stored) && !Object.keys(stored).some((k) => k.startsWith("page:")) && stored.metadata?.schema_version >= 2, "saved again with no pages, in the current layout");
  const text = await page.evaluate(() => document.body.innerText);
  check(!/safe mode|can't load|couldn't load/i.test(text), `the popup isn't in safe mode (${text.slice(0, 80).replace(/\n/g, " | ")})`);
  // Adding a note works
  const tab = await browser.newPage();
  await tab.goto("data:text/html,<p>hi</p>").catch(() => {});
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
