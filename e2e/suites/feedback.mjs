// 5.1: asking active users for feedback once in the popup, and from Settings
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker } from "../env.mjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "fb-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--ignore-certificate-errors", "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1"] });
const note = (i) => ({ id: "n" + i, position: { x: 80, y: 100 }, size: { width: 260 }, title: "Note " + i, body: "", date_created: 1, color: "yellow", visible: true, tags: [] });
try {
  const id = (await browser.waitForTarget((t) => t.url().startsWith("chrome-extension://"))).url().split("/")[2];
  await sleep(1500);
  const seed = async (feedback, analytics = false) => {
    let sw = await extensionWorker(browser);
    await sw.evaluate(async (data) => { const { metadata } = await chrome.storage.local.get("metadata"); await chrome.storage.local.clear(); await chrome.storage.local.set({ ...data, metadata: { ...metadata, onboarded: true, analytics_enabled: data.analytics } }); },
      { pages: { "https://a.com/": { notes: [1, 2, 3].map(note) } }, tags: [], feedback, analytics });
    await browser.installExtension(EXT); await backgroundReady(browser);
    await sleep(1800);
    sw = await extensionWorker(browser);
    await sw.evaluate(() => { self.__events = []; const real = self.fetch; self.fetch = async (url, init) => { if (String(url).includes("/i/v0/e/")) { self.__events.push(JSON.parse(init.body)); return new Response("{}"); } return real(url, init); }; });
    return () => sw.evaluate(() => self.__events);
  };
  const openPopup = async () => { const p = await browser.newPage(); await p.setViewport({ width: 380, height: 600 }); await p.goto(`chrome-extension://${id}/popup.html`); await sleep(1200); return p; };
  const day = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

  const events = await seed({});
  let popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')), "no built-in prompt any more (questions come from PostHog)");
  // Settings: always there
  await popup.click('[data-testid="popup-nav-settings"]').catch(async () => popup.click('[aria-label="Settings"]'));
  await sleep(400);
  await popup.click('[data-testid="settings-feedback"]');
  await sleep(300);
  await popup.type('[data-testid="feedback-message"]', "The board is great");
  await popup.click('[data-testid="feedback-send"]');
  await sleep(1200);
  const fromSettings = (await events()).filter((e) => e.event === "feedback_submitted").at(-1);
  check(fromSettings?.properties.message === "The board is great" && fromSettings.properties.prompted === false && !("email" in fromSettings.properties), "Settings: Send feedback works any time");
  await popup.screenshot({ path: `${OUT}/feedback-settings.png` });
  await popup.close();

  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
