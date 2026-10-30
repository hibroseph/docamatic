// Showing a note on more than one page: the popup's "Can't find a note?" on
// a page without notes, and the "Show on other pages" picker in a note.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, WEB, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
const HOME = `${WEB}/marketplace/?ref=bookmark`;
const SEARCH = `${WEB}/marketplace/portland/search/?query=moped`;
const OTHER = `${WEB}/article.html`;
const PATTERN = `${WEB}/marketplace/*`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
// The page key a note is saved under, from the per-page storage keys
const keyOf = (ext, noteId) =>
  ext.evaluate(async (noteId) => {
    const stored = await chrome.storage.local.get(null);
    return Object.entries(stored).find(([k, v]) => k.startsWith("page:") && v.notes?.some((n) => n.id === noteId))?.[0].slice(5);
  }, noteId);
// Elements inside the notes' closed shadow root, through DevTools
const attrs = (node) => Object.fromEntries((node.attributes || []).flatMap((v, i, all) => (i % 2 ? [] : [[v, all[i + 1]]])));
const inNotes = async (page) => {
  const cdp = await page.createCDPSession();
  const find = async (test) => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const walk = (n) => {
      if (n.attributes && test(attrs(n))) return n;
      for (const c of [...(n.children || []), ...(n.shadowRoots || [])]) { const f = walk(c); if (f) return f; }
    };
    return walk(root);
  };
  const click = async (test, what) => {
    const node = await find(test);
    if (!node) throw new Error(`Not on the page: ${what}`);
    const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: node.backendNodeId });
    const q = model.content;
    await page.mouse.click((q[0] + q[4]) / 2, (q[1] + q[5]) / 2);
    await sleep(400);
  };
  const partTexts = async () => {
    const texts = [];
    for (let i = 0; i < 8; i++) {
      const n = await find((a) => a["data-testid"] === "pages-picker-part" && a["data-part-index"] === String(i));
      if (!n) break;
      texts.push(n.children?.[0]?.nodeValue);
    }
    return texts;
  };
  // The element's border box: { left, top, right, bottom }
  const box = async (test) => {
    const node = await find(test);
    if (!node) return null;
    const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: node.backendNodeId });
    const q = model.border;
    return { left: q[0], top: q[1], right: q[4], bottom: q[5] };
  };
  return { find, click, partTexts, box, hasNote: async (id) => Boolean(await find((a) => a["data-note-id"] === id)) };
};
const part = (index) => (a) => a["data-testid"] === "pages-picker-part" && a["data-part-index"] === String(index);

try {
  await backgroundReady(browser);
  const extId = (await extensionWorker(browser)).url().split("/")[2];
  await sleep(1500);
  const ext = await browser.newPage();
  await ext.goto(`chrome-extension://${extId}/options.html`);

  // A note on the Marketplace home
  const home = await browser.newPage();
  await home.setViewport({ width: 1280, height: 800 });
  await home.goto(HOME); await notesShown(home);
  await sleep(1200);
  const tabId = await ext.evaluate(async (url) => (await chrome.tabs.query({ url }))[0].id, HOME);
  const { noteId } = await ext.evaluate((tabId) => chrome.runtime.sendMessage({ type: "create_note", tabId, placement: "page", source: "popup" }), tabId);
  await home.bringToFront();
  await sleep(1000);
  await home.keyboard.type("Moped budget: $800");
  await sleep(800);
  check((await keyOf(ext, noteId)) === `${WEB}/marketplace/`, "the note starts on the Marketplace page only");

  // Its picker shows the address in parts
  const homeNotes = await inNotes(home);
  await homeNotes.click((a) => a["aria-label"] === "More options", "the note's More button");
  await homeNotes.click((a) => a["data-testid"] === "note-show-on", "Show on other pages");
  const homeParts = await homeNotes.partTexts();
  console.log("parts:", JSON.stringify(homeParts));
  check(JSON.stringify(homeParts) === JSON.stringify(["localhost:8765", "marketplace", "this page"]), "the picker shows the site, the folder and this page");
  await homeNotes.click(part(1), "marketplace");
  await home.screenshot({ path: `${OUT}/notepages-picker.png` });
  await homeNotes.click((a) => a["data-testid"] === "pages-picker-cancel", "Cancel");
  check((await keyOf(ext, noteId)) === `${WEB}/marketplace/`, "Cancel leaves it where it was");

  // A search: a different address, so the note isn't there
  const search = await browser.newPage();
  await search.setViewport({ width: 1280, height: 800 });
  await search.goto(SEARCH);
  await sleep(2000);
  const searchNotes = await inNotes(search);
  check(!(await searchNotes.hasNote(noteId)), "the note isn't on the search page at first");

  // The popup there: Can't find a note?
  const popup = await browser.newPage();
  await popup.setViewport({ width: 380, height: 600 });
  await popup.evaluateOnNewDocument((url) => {
    const query = chrome.tabs.query.bind(chrome.tabs);
    chrome.tabs.query = (info) => (info?.active ? query({ url }).then((t) => t.slice(0, 1)) : query(info));
  }, SEARCH);
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await sleep(1500);
  const toggleText = await popup.$eval(".lost-notes__toggle", (e) => e.textContent).catch(() => null);
  console.log("toggle:", JSON.stringify(toggleText));
  check(/Can't find a note\? You have 1 on other pages of localhost/.test(toggleText || ""), "the popup offers the note from elsewhere on the site");
  await popup.click(".lost-notes__toggle");
  await sleep(300);
  const showHere = await popup.$eval('[data-testid="lost-note-show-here"]', (e) => e.textContent).catch(() => null);
  console.log("show here:", JSON.stringify(showHere));
  check(showHere === "Show on every page of localhost/marketplace", "and suggests the pages the two have in common");
  await popup.screenshot({ path: `${OUT}/notepages-lost.png` });
  await popup.click('[data-testid="lost-note-show-here"]');
  await sleep(1500);
  check((await keyOf(ext, noteId)) === PATTERN, "the note is now saved for every Marketplace page");
  await search.bringToFront();
  await sleep(800);
  check(await searchNotes.hasNote(noteId), "and shows on the open search page without a reload");
  check(await homeNotes.hasNote(noteId), "and still on the Marketplace home");

  // Other pages of the site don't get it
  const other = await browser.newPage();
  await other.goto(OTHER);
  await sleep(2000);
  check(!(await (await inNotes(other)).hasNote(noteId)), "pages outside Marketplace don't show it");

  // The picker on the search page: starts where the note is; narrow it to this search
  await search.bringToFront();
  await searchNotes.click((a) => a["aria-label"] === "More options", "the note's More button");
  await searchNotes.click((a) => a["data-testid"] === "note-show-on", "Show on other pages");
  const chosen = await searchNotes.find((a) => a["data-testid"] === "pages-picker-part" && a["aria-checked"] === "true");
  check(attrs(chosen || {})["data-part-index"] === "1", "the picker starts at marketplace, where the note is");
  console.log("search parts:", JSON.stringify(await searchNotes.partTexts()));
  // The longest summary ("Every page of localhost:8765/marketplace/portland/search")
  // is wider than the note, so it has to wrap
  await searchNotes.click(part(3), "search");
  const noteBox = await searchNotes.box((a) => a["data-note-id"] === noteId);
  // Save sits at the end of the picker's column, so it's where the address
  // would push things out (the picker's own border stays put)
  const saveBox = await searchNotes.box((a) => a["data-testid"] === "pages-picker-save");
  console.log("note:", JSON.stringify(noteBox), "save:", JSON.stringify(saveBox));
  check(noteBox && saveBox && saveBox.right <= noteBox.right && saveBox.bottom <= noteBox.bottom, "the picker's contents stay inside the note");
  await searchNotes.click(part(4), "?query=moped");
  await search.screenshot({ path: `${OUT}/notepages-picker-search.png` });
  await searchNotes.click((a) => a["data-testid"] === "pages-picker-save", "Save");
  await sleep(1500);
  check((await keyOf(ext, noteId)) === `${WEB}/marketplace/portland/search/?query=moped`, "picking the query keeps it on this search only");
  await home.bringToFront();
  await sleep(800);
  check(!(await homeNotes.hasNote(noteId)), "so it leaves the Marketplace home");

  // And wider again, from the picker
  await search.bringToFront();
  await searchNotes.click((a) => a["aria-label"] === "More options", "the note's More button");
  await searchNotes.click((a) => a["data-testid"] === "note-show-on", "Show on other pages");
  await searchNotes.click(part(1), "marketplace");
  await searchNotes.click((a) => a["data-testid"] === "pages-picker-save", "Save");
  await sleep(1500);
  check((await keyOf(ext, noteId)) === PATTERN, "picking marketplace shows it on every Marketplace page again");
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
