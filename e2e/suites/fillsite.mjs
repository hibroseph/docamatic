// Chrome: old notes get their missing details on a visit; the popup's site access notice
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
const WEB = "http://localhost:8765/article.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "fs-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--ignore-certificate-errors", "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1"] });
try {
  await sleep(1500);
  const id = browser.targets().find((t) => t.type() === "service_worker").url().split("/")[2];
  const sw = await extensionWorker(browser);
  // Two old notes without created_on_url: one under this page's exact address, one under the
  // broad address older versions used (everything after ? dropped)
  await sw.evaluate(async (url) => {
    const { metadata } = await chrome.storage.local.get("metadata");
    const old = (id) => ({ id, position: { x: 100, y: 150 }, size: { width: 240 }, title: "Old " + id, body: "", date_created: 1, color: { title: "#fff1a3", text: "#000" }, visible: true });
    await chrome.storage.local.set({ metadata: { ...metadata, onboarded: true }, pages: { [url + "?id=7"]: { notes: [old("exact")] }, [url]: { notes: [old("broad")] } }, tags: [] });
  }, WEB);
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1800);
  const page = await browser.newPage();
  await page.goto(WEB + "?id=7&utm_source=newsletter&token=secret#comments"); await notesShown(page);
  await sleep(3000);
  const reader = await browser.newPage();
  await reader.goto(`chrome-extension://${id}/popup.html`);
  const pages = await reader.evaluate(() => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })).then((s) => s.pages));
  const exact = pages[WEB + "?id=7"].notes[0];
  const broad = pages[WEB].notes[0];
  console.log("exact:", exact.created_on_url, "| broad:", broad.created_on_url, "| title:", pages[WEB + "?id=7"].title);
  check(exact.created_on_url === WEB + "?id=7&utm_source=newsletter#comments", "an old note saved under this exact page gets its address (credentials removed)");
  check(broad.created_on_url === undefined, "one under an older, broader address doesn't (it may be from another page)");
  check(pages[WEB + "?id=7"].title === "The Forgetting Curve - A Short Guide", "and the page gets its title");
  await reader.close();

  // The site access notice, with the browser's answers stubbed (a test can't withhold access in Chrome)
  const popup = await browser.newPage();
  await popup.setViewport({ width: 380, height: 600 });
  await popup.evaluateOnNewDocument((url) => {
    const q = chrome.tabs.query.bind(chrome.tabs);
    chrome.tabs.query = () => q({ url }).then((t) => t.slice(0, 1));
    window.__allowed = false;
    chrome.permissions.contains = async () => window.__allowed;
    chrome.permissions.request = async (p) => { window.__requested = p; window.__allowed = true; return true; };
  }, WEB + "*");
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await sleep(1500);
  const notice = await popup.$eval('[data-testid="site-access"]', (e) => e.innerText).catch(() => null);
  console.log("notice:", JSON.stringify(notice));
  check(/isn't allowed on localhost/.test(notice || ""), "the popup says Docamatic isn't allowed on the site");
  await popup.screenshot({ path: `${OUT}/site-access.png` });
  await popup.click('[data-testid="site-access-allow"]');
  await sleep(500);
  const asked = await popup.evaluate(() => window.__requested);
  check(JSON.stringify(asked) === JSON.stringify({ origins: ["http://localhost/*"] }), `Allow asks for that site only (${JSON.stringify(asked)})`);
  check(!(await popup.$('[data-testid="site-access"]')), "and the notice goes once allowed");
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
