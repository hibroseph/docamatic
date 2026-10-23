// The popup's note menu opens where it fits, and pressing a scrollbar doesn't close it.
// The board opens a note in full.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
const WEB = "http://localhost:8765/article.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "mf-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--ignore-certificate-errors", "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1"] });
const note = (i) => ({ id: "n" + i, position: { x: 80, y: 100 + i * 200 }, size: { width: 260 }, title: "Note " + i, body: i === 1 ? "A long note. ".repeat(60) : "Text " + i, date_created: Date.now() - i * 1000, color: "yellow", visible: true, tags: [] });
try {
  const id = (await browser.waitForTarget((t) => t.url().startsWith("chrome-extension://"))).url().split("/")[2];
  await sleep(1500);
  const sw = await extensionWorker(browser);
  await sw.evaluate(async (data) => { const { metadata } = await chrome.storage.local.get("metadata"); await chrome.storage.local.set({ ...data, metadata: { ...metadata, onboarded: true, hints: { board: true } } }); },  // (the board tip would take the room the menu is tested in)
    { pages: { [WEB]: { notes: [1, 2, 3, 4, 5, 6].map(note) } }, tags: [] });
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(2000);
  const web = await browser.newPage();
  await web.goto(WEB); await notesShown(web);
  await sleep(1000);
  const popup = await browser.newPage();
  await popup.setViewport({ width: 380, height: 600 });
  await popup.evaluateOnNewDocument((url) => { const q = chrome.tabs.query.bind(chrome.tabs); chrome.tabs.query = () => q({ url }).then((t) => t.slice(0, 1)); }, WEB);
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await sleep(1500);
  // The last note in the list, scrolled to the bottom
  await popup.$eval(".content", (el) => (el.scrollTop = el.scrollHeight));
  await sleep(300);
  const buttons = await popup.$$('[aria-label="More options"]');
  await buttons.at(-1).click();
  await sleep(300);
  const fit = await popup.evaluate(() => {
    const menu = [...document.querySelectorAll(".note-menu")].find((m) => !m.hidden);
    const area = document.querySelector(".content").getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    return { up: menu.classList.contains("note-menu--up"), top: Math.round(box.top), bottom: Math.round(box.bottom), areaTop: Math.round(area.top), areaBottom: Math.round(area.bottom) };
  });
  console.log("menu:", JSON.stringify(fit));
  check(fit.up && fit.bottom <= fit.areaBottom && fit.top >= fit.areaTop, "the last note's menu opens upward, all of it in view");
  await popup.screenshot({ path: `${OUT}/menu-up.png` });
  // Press the list's scrollbar
  const bar = await popup.$eval(".content", (el) => { const r = el.getBoundingClientRect(); return { x: r.right - 4, y: r.top + r.height / 2 }; });
  await popup.mouse.click(bar.x, bar.y);
  await sleep(300);
  check(await popup.evaluate(() => [...document.querySelectorAll(".note-menu")].some((m) => !m.hidden)), "pressing the scrollbar doesn't close the menu");
  await popup.mouse.click(150, 120);
  await sleep(300);
  check(await popup.evaluate(() => [...document.querySelectorAll(".note-menu")].every((m) => m.hidden)), "clicking elsewhere still closes it");
  // The first note's menu still opens downward
  await popup.$eval(".content", (el) => (el.scrollTop = 0));
  await sleep(200);
  await (await popup.$$('[aria-label="More options"]'))[0].click();
  await sleep(300);
  check(await popup.evaluate(() => ![...document.querySelectorAll(".note-menu")].find((m) => !m.hidden).classList.contains("note-menu--up")), "a note near the top opens its menu downward, as before");

  // ---- Board: open a note in full
  const board = await browser.newPage();
  await board.setViewport({ width: 1366, height: 860 });
  await board.goto(`chrome-extension://${id}/board.html`);
  await sleep(1500);
  await board.click('[data-note-id="n1"] [data-testid="board-note-open"]');
  await sleep(500);
  const dlg = await board.$eval('[data-testid="board-note-dialog"]', (d) => ({ open: d.open, text: d.innerText.length })).catch(() => null);
  check(dlg?.open && dlg.text > 600, `Open shows the whole note (${JSON.stringify(dlg)})`);
  await board.screenshot({ path: `${OUT}/board-open.png` });
  await board.keyboard.press("Escape");
  await sleep(300);
  check(!(await board.$('[data-testid="board-note-dialog"]')), "Escape closes it");
  const card = await board.$eval('[data-note-id="n2"] .board-card__page', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 10, y: r.y + 4 }; });
  await board.mouse.click(card.x, card.y, { count: 2 });
  await sleep(500);
  check(Boolean(await board.$('[data-testid="board-note-dialog"]')), "double-clicking a card opens it too");
  check(!(await board.$('[data-testid="board-note-dialog"] [data-testid="note-title"]')), "read only while Edit notes is off");
  await board.mouse.click(20, 830);
  await sleep(300);
  check(!(await board.$('[data-testid="board-note-dialog"]')), "a click beside it closes it");
  await board.click('[data-testid="board-edit-switch"]');
  await sleep(300);
  await board.click('[data-note-id="n2"] [data-testid="board-note-open"]');
  await sleep(500);
  await board.click('[data-testid="board-note-dialog"] [data-testid="note-title"]');
  await board.keyboard.press("End");
  await board.keyboard.type(" edited in full");
  await sleep(1200);
  const title = await board.evaluate(async (url) => (await chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }))).pages[url].notes.find((n) => n.id === "n2").title, WEB);
  check(title === "Note 2 edited in full", `with Edit notes on it can be edited there (${title})`);
  await board.screenshot({ path: `${OUT}/board-open-edit.png` });
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
