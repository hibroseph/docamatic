// 5.0.2: unusable saved data with no notes starts fresh and notes can be made;
// data that may hold a note still goes to safe mode, untouched.
// Usage: node startfresh.mjs <dist> <popup file>
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
const POPUP = "popup.html";
const WEB = "http://localhost:8765/";
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };

const run = async (name, seed, expectFresh) => {
  console.log(`-- ${name}`);
  const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "sf-")),
    args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
  try {
    const id = await browser.installExtension(EXT); await backgroundReady(browser);
    await sleep(1500);
    const sw = await (await extensionWorker(browser));
    await sw.evaluate(async (data) => { await chrome.storage.local.clear(); await chrome.storage.local.set(data); }, seed);
    await browser.installExtension(EXT); await backgroundReady(browser); // the update
    await sleep(2500);
    const web = await browser.newPage();
    await web.goto(WEB); await notesShown(web);
    await sleep(1000);
    const popup = await browser.newPage();
    // The popup adds to the active tab; here that's the popup's own tab, so point it at the web page
    await popup.evaluateOnNewDocument((url) => {
      const query = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = (info, cb) => {
        const p = query({ url: url + "*" }).then((tabs) => tabs.slice(0, 1));
        if (cb) p.then(cb); else return p;
      };
    }, WEB);
    await popup.goto(`chrome-extension://${id}/${POPUP}`);
    await sleep(1200);
    const text = await popup.evaluate(() => document.body.innerText);
    const safe = /safe mode|couldn't be loaded|can't be loaded|Backup & Restore/i.test(text);
    const before = await popup.evaluate(() => chrome.storage.local.get(null));
    if (expectFresh) {
      check(!safe, "not in safe mode");
      // A fresh start in the current layout (each page under "page:<url>"; none yet)
      check(!("pages" in before) && before.metadata?.schema_version >= 2, `saved fresh in the current layout (keys ${Object.keys(before)})`);
      check((before.backups || []).length > 0, `the old data is in a backup (${(before.backups || []).length})`);
      const create = await popup.$('[data-testid="popup-create-note"]');
      check(Boolean(create), "the new note button is there");
      if (create) await create.click();
      await sleep(2000);
      // (the redesigned popup closes itself after adding a note)
      const reader = await browser.newPage();
      await reader.goto(`chrome-extension://${id}/${POPUP}`);
      const after = await reader.evaluate(() => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })));
      const notes = Object.values(after.pages || {}).flatMap((p) => p.notes || []);
      check(notes.length === 1, `a new note is saved (${notes.length})`);
      const shown = await web.evaluate(() => document.querySelectorAll("*").length && [...document.querySelectorAll("body *")].some((e) => e.shadowRoot !== null || e.tagName.includes("-")));
      check(shown, "the notes layer is on the page");
    } else {
      check(safe, "safe mode");
      check(canon(before.pages) === canon(seed.pages), `the saved data is untouched (${JSON.stringify(before.pages)} keys ${Object.keys(before)})`);
    }
  } finally { await browser.close(); }
};

if (!process.env.ONLY_LAST) {
await run("the Sentry report: pages []", { analytics: { installId: "x" }, metadata: { docamatic_version: "4.0.0", migrated_data_to_storage_local: true }, pages: [] }, true);
await run("unknown shape, no notes", { metadata: { onboarded: true }, pages: { "https://a.com/": { notes: null } }, tags: [{ id: "t", text: "work", color: "#fff", notes: [] }] }, true);
}
await run("unknown shape with a note", { metadata: { onboarded: true }, pages: [{ notes: [{ id: "n1", body: "keep me" }] }], tags: [] }, false);
console.log(fails ? `${fails} FAILED` : "all passed");
