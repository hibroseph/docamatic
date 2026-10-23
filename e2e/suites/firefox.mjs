// The Firefox build in a current Firefox: install, welcome page, popup, a note on a page.
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { CHROME_FLAGS, EXT_FIREFOX, FIREFOX, OUT, PAGES } from "../env.mjs";
// A copy of the Firefox build whose pages a web page may open (only so the
// test can reach them: WebDriver BiDi won't navigate to extension pages)
const FFEXT = join(mkdtempSync(join(tmpdir(), "ffext-")), "ext").split("\\").join("/");
cpSync(EXT_FIREFOX, FFEXT, { recursive: true });
const manifest = JSON.parse(readFileSync(join(FFEXT, "manifest.json"), "utf8"));
manifest.web_accessible_resources = [...(manifest.web_accessible_resources || []), { resources: ["popup.html", "onboarding.html", "board.html"], matches: ["<all_urls>"] }];
writeFileSync(join(FFEXT, "manifest.json"), JSON.stringify(manifest));
if (!FIREFOX) {
  console.log("SKIP no Firefox (set FIREFOX_PATH)");
  process.exit(0);
}
const WEB = "http://localhost:8765/article.html";
const UUID = "6a5e1d1e-0d0c-4a6e-9a7e-0123456789ab";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await puppeteer.launch({
  browser: "firefox",
  executablePath: FIREFOX,
  headless: true,
  userDataDir: mkdtempSync(join(tmpdir(), "ff-")),
  args: [...CHROME_FLAGS, "-remote-allow-system-access"],
  extraPrefsFirefox: {
    // A known address for the extension's pages
    "extensions.webextensions.uuids": JSON.stringify({ "docamatic@hibroseph.github.io": UUID }),
    "xpinstall.signatures.required": false,
    "network.dns.localDomains": "us.i.posthog.com,sentry.io,o0.ingest.sentry.io",
    // Accept permission requests without the prompt (testing only)
    "extensions.webextOptionalPermissionPrompts": false,
  },
});
const base = `moz-extension://${UUID}`;
// Opens an extension page in `page` by way of a web page
const openExt = async (page, path) => {
  await page.goto(WEB);
  await page.evaluate((url) => (location.href = url), `${base}/${path}`);
  await sleep(1500);
};
const logs = [];
const watch = (page, name) => {
  page.on("console", (m) => { if (["error", "warn"].includes(m.type()) || m.text().includes("DMDEBUG")) logs.push(`${name} ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => logs.push(`${name} PAGEERROR: ${String(e.message || e).slice(0, 200)}`));
};
try {
  const id = await browser.installExtension(FFEXT);
  console.log("installed:", id);
  await sleep(2500);
  const pages = await browser.pages();
  console.log("open:", pages.map((p) => p.url()).join(" | "));

  // Welcome page
  const welcome = await browser.newPage();
  watch(welcome, "welcome");
  await welcome.setViewport({ width: 1280, height: 900 });
  await openExt(welcome, "onboarding.html");

  check((await welcome.evaluate(() => document.querySelector("h1")?.textContent || "")).length > 0, "the welcome page renders");

  // A web page, and the popup pointed at it
  const web = await browser.newPage();
  watch(web, "web");
  await web.setViewport({ width: 1280, height: 900 });
  await web.goto(WEB);
  await sleep(1500);
  const popup = await browser.newPage();
  watch(popup, "popup");
  await popup.setViewport({ width: 380, height: 600 });
  await openExt(popup, "popup.html");
  await sleep(500);

  const popupText = await popup.evaluate(() => document.body.innerText.slice(0, 200));
  console.log("popup:", JSON.stringify(popupText));
  check(/New note on this page/.test(popupText), "the popup renders");
  const shortcut = await popup.evaluate(() => chrome.commands.getAll().then((c) => c.map((x) => `${x.name}=${x.shortcut}`)));
  console.log("commands:", shortcut.join(", "));
  const tabs = await popup.evaluate(() => chrome.tabs.query({}).then((t) => t.map((x) => x.url)));
  console.log("tabs:", tabs.join(" | "));
  check(tabs.some((u) => u?.endsWith("/onboarding.html")), "the welcome page opened on install");
  // What the popup's button asks the background, for the web page's tab
  const result = await popup.evaluate(async (url) => {
    const tab = (await chrome.tabs.query({})).find((t) => t.url === url);
    return chrome.runtime.sendMessage({ type: "create_note", tabId: tab.id, placement: "page", source: "popup" });
  }, WEB);
  console.log("create:", JSON.stringify(result));
  await sleep(2500);
  const stored = await (async () => {
    const p = await browser.newPage();
    await openExt(p, "popup.html");
    // The notes, gathered in the page (whatever the storage layout)
    const notes = await p.evaluate(() => chrome.storage.local.get(null).then((s) => Object.entries(s).filter(([k]) => k === "pages" || k.startsWith("page:")).flatMap(([k, v]) => (k === "pages" ? Object.values(v || {}) : [v])).flatMap((page) => page?.notes || [])));
    await p.close();
    return notes;
  })();
  const notes = stored;
  check(notes.length === 1, `New note on this page saves a note (${notes.length})`);
  await web.bringToFront();
  await sleep(800);
  const layer = await web.evaluate(() => [...document.querySelectorAll("docamatic-notes")].map((e) => { const r = e.getBoundingClientRect(); return { display: getComputedStyle(e).display, w: Math.round(r.width), h: Math.round(r.height) }; }));
  console.log("notes layer:", JSON.stringify(layer));
  check(layer.length === 1 && layer[0].display !== "none", "the note is put on the page");
  await web.screenshot({ path: `${OUT}/ff-page.png` });
  // The site's keyboard listeners (like PostHog's shortcuts)
  await web.evaluate(() => { window.__keys = 0; window.__seen = {}; for (const t of ["keydown", "keypress", "keyup"]) { window.addEventListener(t, (e) => { window.__keys++; const k = "win-capture " + t + " " + (e.target && e.target.localName); window.__seen[k] = (window.__seen[k] || 0) + 1; }, true); document.addEventListener(t, (e) => { window.__keys++; const k = "doc-bubble " + t + " " + (e.target && e.target.localName); window.__seen[k] = (window.__seen[k] || 0) + 1; }); } });
  // The new note has the cursor: type into it
  await web.keyboard.type("Hello from Firefox");
  await sleep(1500);
  const after = await (async () => {
    const p = await browser.newPage();
    await openExt(p, "popup.html");
    const notes = await p.evaluate(() => chrome.storage.local.get(null).then((s) => Object.entries(s).filter(([k]) => k === "pages" || k.startsWith("page:")).flatMap(([k, v]) => (k === "pages" ? Object.values(v || {}) : [v])).flatMap((page) => page?.notes || [])));
    await p.close();
    return notes;
  })();
  console.log("note:", JSON.stringify(after.map((n) => ({ title: n.title, body: n.body }))));
  check(after.some((n) => /Hello from Firefox/.test(`${n.title || ""}${n.body || ""}`)), "the new note has the cursor: typing goes into it and is saved");
  await web.screenshot({ path: `${OUT}/ff-page-typed.png` });
  console.log("seen by the site:", JSON.stringify(await web.evaluate(() => window.__seen)));
  check((await web.evaluate(() => window.__keys)) === 0, "keys typed in the note don't reach the site's listeners");
  check(!logs.some((l) => /recursion/.test(l)), "no errors while typing");
  // The note's own keys: Escape closes its menu (opened with the mouse)
  await web.mouse.click(1231, 121);
  await sleep(400);
  await web.screenshot({ path: `${OUT}/ff-menu-open.png` });
  await web.keyboard.press("Escape");
  await sleep(400);
  await web.screenshot({ path: `${OUT}/ff-menu-escaped.png` });
  await web.mouse.click(600, 700);
  await web.keyboard.type("ab");
  check((await web.evaluate(() => window.__keys)) > 0, "keys typed elsewhere still reach the site");
  // A file on the computer
  const FILE = "file:///" + PAGES.replace(/^\//, "") + "/localfile/page.html";
  const filePage = await browser.newPage();
  await filePage.goto(FILE);
  await sleep(1200);
  const fileInfo = await popup.evaluate(async (url) => {
    const tab = (await chrome.tabs.query({})).find((t) => t.url === url);
    const allowed = await chrome.extension.isAllowedFileSchemeAccess();
    const result = tab ? await chrome.runtime.sendMessage({ type: "create_note", tabId: tab.id, placement: "page", source: "popup" }) : "no tab";
    return { found: Boolean(tab), allowed, result };
  }, FILE);
  console.log("file page:", JSON.stringify(fileInfo));
  await sleep(1500);
  const fileLayer = await filePage.evaluate(() => document.querySelectorAll("docamatic-notes").length);
  console.log("file page notes layer:", fileLayer);
  // Site access turned off, then allowed again (from a click, as in the popup)
  const removed = await popup.evaluate(() => chrome.permissions.remove({ origins: ["<all_urls>"] }));
  await web.reload();
  await sleep(2000);
  const layerWithout = await web.evaluate(() => document.querySelectorAll("docamatic-notes").length);
  check(removed && layerWithout === 0, `with site access off, notes can't show (removed ${removed}, layers ${layerWithout})`);
  const before = await popup.evaluate(() => chrome.permissions.contains({ origins: ["http://localhost/*"] }));
  await popup.evaluate(() => {
    const b = document.createElement("button");
    b.id = "grant";
    b.textContent = "grant";
    b.onclick = () => chrome.permissions.request({ origins: ["http://localhost/*"] }).then((g) => (window.__granted = g), (e) => (window.__granted = String(e)));
    document.body.prepend(b);
  });
  await popup.click("#grant");
  await sleep(2500);
  console.log("granted:", await popup.evaluate(() => window.__granted), "contained before:", before);
  const layerAfter = await web.evaluate(() => [...document.querySelectorAll("docamatic-notes")].filter((e) => getComputedStyle(e).display !== "none").length);
  check(layerAfter === 1, "once allowed, the open tab shows its notes without a reload");
  // Board
  const board = await browser.newPage();
  watch(board, "board");
  await board.setViewport({ width: 1280, height: 800 });
  await openExt(board, "board.html");
  check((await board.$$eval(".board-card", (e) => e.length)) === 1, "the board shows the note");
  console.log("--- console errors/warnings ---");
  console.log(logs.length ? logs.join("\n") : "(none)");
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
