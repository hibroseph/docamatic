// The board page with a realistic set of notes: both views, dragging, remembering, rearranging
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker } from "../env.mjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const COLORS = { yellow: "#fff1a3", pink: "#ffd6e7", blue: "#d6ecff", green: "#d9f5d6" };
const mk = (id, title, body, tags, color = "yellow", ago = 1) => ({ id, position: { x: 100, y: 100 }, size: { width: 240 }, title, body, date_created: Date.now() - ago * 86400000, color: { title: COLORS[color], text: "#1e2433", name: color }, visible: true, tags: tags.map((t) => ({ id: t })) });
const notes = {
  "https://slowbread.blog/sourdough": { title: "A beginner's sourdough", notes: [mk("n1", "Starter", "Feed your starter the night before.", ["baking"]), mk("n2", "Next time", "Try 75% water and a longer cold proof.", ["baking", "totry"], "pink"), mk("n3", "Flour", "Bread flour, not all-purpose.", ["baking"])] },
  "https://www.amazon.com/dp/B0EXAMPLE": { title: "Dutch oven, 5.5 qt", notes: [mk("n4", "Gift idea", "Mom mentioned she wants one.", ["gifts", "totry"], "blue", 3)] },
  "https://github.com/acme/app/pull/42": { title: "Fix login redirect #42", notes: [mk("n5", "Review", "Check the redirect on Safari before approving.", ["work"], "green", 2), mk("n6", "Question", "Why not reuse the session helper?", ["work"], "yellow", 2)] },
  "https://news.example.com/article": { title: "How cities plan for heat", notes: [mk("n7", "", "Shade trees lower street temperature by up to 10°.", [], "yellow", 5)] },
  "https://www.youtube.com/watch?v=abc": { title: "Knife skills in 10 minutes", notes: [mk("n8", "Claw grip", "Fingertips tucked, knuckles guide the blade.", ["baking", "totry"], "pink", 4), mk("n9", "Hone", "Hone before every use, sharpen twice a year.", ["totry"], "blue", 4)] },
};
const tags = [
  { id: "baking", text: "baking", color: "#ffd84d", notes: ["n1", "n2", "n3", "n8"] },
  { id: "totry", text: "to try", color: "#ff9ec4", notes: ["n2", "n4", "n8", "n9"] },
  { id: "gifts", text: "gifts", color: "#8fc8ff", notes: ["n4"] },
  { id: "work", text: "work", color: "#9de5a0", notes: ["n5", "n6"] },
];
try {
  const extId = await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1500);
  const sw = await (await extensionWorker(browser));
  await sw.evaluate(async (data) => { await chrome.storage.local.clear(); await chrome.storage.local.set(data); }, { pages: notes, tags, metadata: { onboarded: true, schema_version: 1, analytics_enabled: true } });
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1200);
  console.log("hooking worker");
  const swTargets = browser.targets().filter((t) => t.type() === "service_worker" && t.url().includes(extId));
  const sw2 = await extensionWorker(browser);
  console.log("worker", swTargets.length);
  await sw2.evaluate(() => { self.__events = []; const real = self.fetch; self.fetch = async (url, init) => { if (String(url).includes("/i/v0/e/")) { self.__events.push(JSON.parse(init.body)); return new Response("{}"); } return real(url, init); }; });
  const events = () => sw2.evaluate(() => self.__events.map((e) => [e.event, e.properties]));
  // Opened from the popup's new button
  const popup = await browser.newPage();
  await popup.setViewport({ width: 380, height: 560 });
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await sleep(800);
  await popup.screenshot({ path: `${OUT}/board-popup.png` });
  // board.html?from=header: board_opened says which way people find it
  const opened = browser.waitForTarget((t) => t.url().endsWith("/board.html?from=header"), { timeout: 5000 }).then(() => true, () => false);
  await popup.click('[data-testid="popup-open-board"]').catch(() => {});
  check(await opened, "the popup's board button opens board.html (from the header)");

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`chrome-extension://${extId}/board.html`);
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/board-1.png` });
  const cards = await page.$$eval(".board-card", (els) => els.length);
  check(cards === 9, `every note is on the board (${cards})`);
  const groups = await page.$$eval(".board-group", (els) => els.map((e) => e.getAttribute("aria-label")));
  console.log("groups:", groups.join(" | "));
  check(groups[0] === "baking" && groups[1] === "baking and to try" && groups.at(-1) === "No tags", "groups: biggest tag first, shared tags next to it, untagged last");

  check(await page.$('.board-card [data-testid="note-title"]') === null, "Edit notes is off at first: cards on the board are read only");
  // Search fades what doesn't match, keeps the arrangement
  await page.type('[data-testid="board-search"]', "redirect");
  await sleep(400);
  const lit = await page.$$eval(".board-card:not(.is-dimmed)", (els) => els.map((e) => e.dataset.noteId).sort());
  const count = await page.$eval(".board-bar__count", (e) => e.textContent);
  check(JSON.stringify(lit) === '["n5","n6"]' && count === "2 of 9 notes", `search "redirect" lights up the note mentioning it and the one on that PR (${lit}, ${count})`);
  await page.screenshot({ path: `${OUT}/board-search.png` });
  await sleep(1500); // counted once typing stops
  await page.click(".board-search__clear");
  await sleep(300);
  check(await page.$$eval(".board-card.is-dimmed", (els) => els.length) === 0, "clearing the search shows every note again");
  // "/" focuses search
  await page.click(".board-toolbar__hint");
  await page.keyboard.press("/");
  check(await page.evaluate(() => document.activeElement?.dataset.testid) === "board-search", '"/" goes to the search box');
  await page.keyboard.press("Escape");
  // Drag a card, it stays there after reloading
  const box = await page.$eval('[data-note-id="n5"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 60, y: r.y + 80 }; });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + i * 30, box.y + i * 10);
  await page.mouse.up();
  await sleep(500);
  const moved = await page.$eval('[data-note-id="n5"]', (e) => e.style.transform);
  await page.reload();
  await sleep(1200);
  const after = await page.$eval('[data-note-id="n5"]', (e) => e.style.transform);
  check(moved === after && moved.length > 0, `a dragged note stays where it was put after reloading (${after})`);
  await page.screenshot({ path: `${OUT}/board-2.png` });
  // Arrange by tag puts it back
  await page.evaluate(() => [...document.querySelectorAll(".board-toolbar button")].find((b) => b.textContent.includes("Arrange")).click());
  await sleep(500);
  const reset = await page.$eval('[data-note-id="n5"]', (e) => e.style.transform);
  check(reset !== after, "Arrange by tag puts it back in its group");

  // By tag view
  await page.evaluate(() => [...document.querySelectorAll(".board-tabs .dm-tab")].find((b) => b.textContent === "By tag").click());
  await sleep(600);
  const sections = await page.$$eval(".tag-section", (els) => els.map((e) => [e.getAttribute("aria-label"), e.querySelectorAll('[data-note-id]').length]));
  console.log("sections:", JSON.stringify(sections));
  check(JSON.stringify(sections) === JSON.stringify([["Tag baking", 4], ["Tag to try", 4], ["Tag work", 2], ["Tag gifts", 1], ["No tags", 1]]), "a section per tag; shared notes in each of their tags");
  await page.screenshot({ path: `${OUT}/board-3.png` });
  check(await page.$('.tag-section [data-testid="note-title"]') === null, "with Edit notes off, the By tag cards are read only");
  // Search filters the grid
  await page.type('[data-testid="board-search"]', "redirect");
  await sleep(400);
  const found = await page.$$eval(".tag-section", (els) => els.map((e) => [e.getAttribute("aria-label"), e.querySelectorAll('[data-note-id]').length]));
  check(JSON.stringify(found) === JSON.stringify([["Tag work", 2]]), `search in By tag leaves only matches (${JSON.stringify(found)})`);
  await page.keyboard.press("Escape");
  await sleep(300);
  // Editing a card there saves the note
  await page.click('[data-testid="board-edit-switch"]');
  await sleep(300);
  await page.click('.tag-section [data-note-id="n7"] [data-testid="note-title"]');
  await page.keyboard.type("Heat");
  await sleep(1200);
  const title = await page.evaluate(async () => (await chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }))).pages["https://news.example.com/article"].notes[0].title);
  check(title === "Heat", `notes can be edited in the By tag view (${title})`);
  check(await page.$('.tag-section [data-testid="note"]') !== null, "with Edit notes on, the By tag view uses the editable cards");
  // Editing on the canvas, and the switch is remembered
  await page.evaluate(() => [...document.querySelectorAll(".board-tabs .dm-tab")].find((b) => b.textContent === "Board").click());
  await sleep(500);
  await page.reload();
  await sleep(1200);
  check(await page.$eval('[data-testid="board-edit-switch"]', (e) => e.getAttribute("aria-checked")) === "true", "Edit notes stays on after reloading");
  const before = await page.$eval('[data-note-id="n1"]', (e) => e.style.transform);
  await page.click('.board-card[data-note-id="n1"] .note-body-field');
  await page.keyboard.press("End");
  await page.keyboard.type(" Overnight.");
  await sleep(1200);
  const body = await page.evaluate(async () => (await chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }))).pages["https://slowbread.blog/sourdough"].notes[0].body);
  check(body.includes("Overnight.") && before === (await page.$eval('[data-note-id="n1"]', (e) => e.style.transform)), `a note's text can be edited on the canvas, without moving it (${body})`);
  await page.screenshot({ path: `${OUT}/board-editing.png` });
  // Still draggable by its edges while editing
  const foot = await page.$eval('[data-note-id="n1"] .board-card__page', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 10, y: r.y + 5 }; });
  await page.mouse.move(foot.x, foot.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(foot.x + i * 25, foot.y + i * 5);
  await page.mouse.up(); await sleep(400);
  check(before !== (await page.$eval('[data-note-id="n1"]', (e) => e.style.transform)), "while editing, a card still drags by its edges");
  const sent = (await events()).map(([e, p]) => `${e}${p.view ? ":" + p.view : ""}${"editing" in p ? ":" + p.editing : ""}${"result_count" in p ? ":" + p.result_count : ""}`);
  console.log("events:", sent.join(", "));
  const all = JSON.stringify(await events());
  check(["board_opened", "board_searched:board:2", "board_note_moved", "board_arranged", "board_view_changed", "board_edit_mode_changed:tags:true", "board_note_edited"].every((e) => sent.some((s) => s.startsWith(e))), "board usage is sent to analytics");
  check(!all.includes("redirect") && !all.includes("Overnight") && !all.includes("Heat"), "never what was searched or written");
  // Dark theme
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.evaluate(() => [...document.querySelectorAll(".board-tabs .dm-tab")].find((b) => b.textContent === "Board").click());
  await sleep(500);
  await page.screenshot({ path: `${OUT}/board-dark.png` });
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
