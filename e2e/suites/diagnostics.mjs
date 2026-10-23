// 5.1: Download diagnostic report, from Settings and from the safe mode screen
import { mkdtempSync, readdirSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, launchChrome } from "../env.mjs";
const DOWNLOADS = join(mkdtempSync(join(tmpdir(), "dl-")), "downloads");
mkdirSync(DOWNLOADS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dg-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--ignore-certificate-errors", "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1"] });
const SECRETS = ["Mortgage", "account number 1234", "private-bank", "health", "Dear diary", "Users/me"];
const seed = async (data) => {
  const sw = await extensionWorker(browser);
  await sw.evaluate(async (d) => {
    const { metadata, analytics } = await chrome.storage.local.get(["metadata", "analytics"]);
    await chrome.storage.local.clear();
    await chrome.storage.local.set({ analytics, ...d, metadata: { ...metadata, ...(d.metadata || {}), onboarded: true } });
  }, data);
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1800);
};
const download = async (page, click) => {
  rmSync(DOWNLOADS, { recursive: true, force: true });
  mkdirSync(DOWNLOADS, { recursive: true });
  const cdp = await page.createCDPSession();
  await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: DOWNLOADS });
  await click();
  for (let i = 0; i < 30; i++) {
    const files = readdirSync(DOWNLOADS).filter((f) => f.endsWith(".json"));
    if (files.length) return { name: files[0], text: readFileSync(join(DOWNLOADS, files[0]), "utf8") };
    await sleep(200);
  }
  return null;
};
try {
  await sleep(1500);
  const id = browser.targets().find((t) => t.type() === "service_worker").url().split("/")[2];
  await seed({
    pages: {
      "https://private-bank.example/loans?id=9#rates": {
        title: "Mortgage rates - Private Bank",
        notes: [
          { id: "n1", title: "Mortgage", body: "account number 1234", position: { x: -20, y: 100 }, size: { width: 240 }, color: { name: "yellow", title: "#fff1a3", text: "#000" }, visible: true, tags: [{ id: "t1" }] },
          { id: "n2", title: "", body: "Dear diary", position: { x: 50, y: 50 }, size: { width: 240 }, color: { name: "pink", title: "#ffd9ea", text: "#000" }, visible: true },
        ],
      },
    },
    tags: [{ id: "t1", text: "health", color: "#9de5a0", notes: ["n1"] }],
    metadata: { preferences: { theme: "dark" } },
  });
  // A real error on the way: adding a note to a tab that doesn't exist
  const popup = await browser.newPage();
  await popup.setViewport({ width: 380, height: 700 });
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await sleep(1200);
  await popup.evaluate(() => chrome.runtime.sendMessage({ type: "create_note", tabId: 987654321, placement: "page", source: "popup" }).catch(() => {}));
  await sleep(800);
  await popup.click('[data-testid="popup-nav-settings"]');
  await sleep(500);
  const file = await download(popup, () => popup.click('[data-testid="diagnostics-download"]'));
  check(Boolean(file) && /^docamatic-diagnostics-\d{4}-\d{2}-\d{2}\.json$/.test(file.name), `Settings downloads the report (${file?.name})`);
  const report = JSON.parse(file.text);
  console.log("sections:", Object.keys(report).join(", "));
  check(report.format === "docamatic-diagnostics" && report.extension.version && typeof report.extension.install_id === "string", "with the version and the install id (to match Sentry and PostHog)");
  check(report.notes.notes.count === 2 && report.notes.notes.position.left_of_page === 1 && report.notes.tags.count === 1 && report.state.preferences.theme === "dark", "counts and settings are there");
  check(report.recent_errors.some((e) => /No tab with id/.test(e.message) && e.during === "creating a note"), `recent errors are there (${JSON.stringify(report.recent_errors.at(-1))})`);
  const leaked = SECRETS.filter((s) => file.text.includes(s));
  check(leaked.length === 0, `no note text, titles, tag names or addresses in it (${leaked.join(", ") || "none"})`);
  check(/none of your notes/.test(await popup.$eval('.settings__help[role="status"]', (e) => e.textContent)), "Settings says what it is");
  await popup.screenshot({ path: `${OUT}/diagnostics-settings.png` });
  await popup.close();

  // Safe mode: notes in a shape that can't be loaded
  await seed({ pages: [{ notes: [{ id: "x", body: "Dear diary" }] }], tags: [] });
  const safe = await browser.newPage();
  await safe.setViewport({ width: 380, height: 600 });
  await safe.goto(`chrome-extension://${id}/popup.html`);
  await sleep(1500);
  check(Boolean(await safe.$('[data-testid="popup-safe-mode-banner"]')), "safe mode");
  await safe.screenshot({ path: `${OUT}/diagnostics-safe-mode.png` });
  const safeFile = await download(safe, () => safe.click('[data-testid="diagnostics-download"]'));
  const safeReport = safeFile && JSON.parse(safeFile.text);
  console.log("safe mode state:", JSON.stringify(safeReport?.state));
  check(safeReport?.state.safe_mode?.reason === "invalid_state" && safeReport.storage.shape["pages.type"] === "array", "the safe mode screen downloads it too, with why");
  check(!safeFile.text.includes("Dear diary"), "still without the notes");
  check(safeReport.state.onboarded === true && safeReport.state.preferences.theme === "dark" && safeReport.notes.pages.count === 0, "describing what is saved, not the placeholder");
  require_ok: { const fs = await import("node:fs"); fs.writeFileSync(`${OUT}/diagnostics-sample.json`, file.text); }
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
