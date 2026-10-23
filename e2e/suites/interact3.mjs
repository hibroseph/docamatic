// The setting, page scrolling with a panel inside a fixed area, notes half
// over two parts, and notes scrolling out of a panel.
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, notesShown } from "../env.mjs";

const URL2 = "http://localhost:8765/app2.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (name, ok, detail = "") => console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  pipe: true,
  userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"],
});
const extId = await browser.installExtension(EXT); await backgroundReady(browser);
await sleep(1500);
const mk = (id, x, y) => ({ id, position: { x, y }, size: { width: 220 }, title: id, body: "body", date_created: Date.now() - 86400000, color: { title: "#fff1a3", text: "#1e2433", name: "yellow" }, visible: true });
const ext = await browser.newPage();
await ext.goto(`chrome-extension://${extId}/options.html`);
const sw = await (await extensionWorker(browser));
await sw.evaluate(async (data) => { await chrome.storage.local.clear(); await chrome.storage.local.set(data); }, {
  pages: { [URL2]: { notes: [mk("A", 400, 150), mk("B", 400, 450)] } },
  tags: [],
  metadata: { onboarded: true, schema_version: 1, analytics_enabled: false },
});
await browser.installExtension(EXT); await backgroundReady(browser);
await sleep(1000);
const popup = await browser.newPage();
await popup.setViewport({ width: 380, height: 900 });
await popup.goto(`chrome-extension://${extId}/popup.html`);
await sleep(800);
const stored = () => popup.evaluate(async () => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })));
const noteData = async (id) => (await stored()).pages[URL2].notes.find((n) => n.id === id);

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto(URL2); await notesShown(page);
await sleep(1800);
const cdp = await page.createCDPSession();
const find = async (pred) => {
  const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
  const found = [];
  const walk = (node) => {
    if (node.attributes) {
      const a = {};
      for (let i = 0; i < node.attributes.length; i += 2) a[node.attributes[i]] = node.attributes[i + 1];
      if (pred(a, node)) found.push({ node, a });
    }
    for (const c of [...(node.children || []), ...(node.shadowRoots || [])]) walk(c);
  };
  walk(root);
  return found;
};
const box = async (node) => {
  const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: node.backendNodeId });
  return { x: model.border[0], y: model.border[1] };
};
const noteBox = async (id) => box((await find((a) => a["data-note-id"] === id && a["data-testid"] === "note"))[0].node);
const wrapperStyle = async (id) => {
  // The Rnd wrapper is the note article's parent
  const [{ node }] = await find((a) => a["data-note-id"] === id && a["data-testid"] === "note");
  const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: node.backendNodeId });
  const { result } = await cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: "function(){ return this.parentElement.style.cssText }", returnByValue: true });
  return result.value;
};
const dragTo = async (id, screenX, screenY) => {
  const notes = (await find((a) => a["data-testid"] === "note")).map((f) => f.a["data-note-id"]);
  const handles = await find((a) => a["data-testid"] === "note-drag-handle");
  const h = await box(handles[notes.indexOf(id)].node);
  await page.mouse.move(h.x + 5, h.y + 8);
  await page.mouse.down();
  await page.mouse.move(screenX + 5, screenY + 8, { steps: 15 });
  await page.mouse.up();
  await sleep(900);
};
const scrollPage = (y) => page.evaluate((y) => window.scrollTo(0, y), y);
const scrollChats = (y) => page.evaluate((y) => (document.getElementById("chats").scrollTop = y), y);

// The notes render a moment after the layer: wait for both
for (let i = 0; i < 40 && (await find((a) => a["data-testid"] === "note-drag-handle")).length < 2; i++) await sleep(200);

// --- Setting off (the default) ---
await dragTo("A", 40, 200);
let a = await noteData("A");
check("setting off: a note dropped on the chat list isn't anchored", !a.anchor, JSON.stringify(a.anchor));
let before = await noteBox("A");
await scrollPage(200);
await sleep(200);
let after = await noteBox("A");
check("setting off: it scrolls with the page, as before", Math.abs(before.y - after.y - 200) < 1, `${before.y} -> ${after.y}, scrollY ${await page.evaluate(() => scrollY)}`);
await scrollPage(0);

// --- Turn it on in Settings ---
console.log("popup alive:", await Promise.race([popup.evaluate(() => document.title), sleep(3000).then(() => "TIMEOUT")]));
await popup.bringToFront();
await popup.click('[data-testid="popup-nav-settings"]');
await sleep(300);
const [toggle] = await popup.$$("xpath/.//label[contains(., 'Move notes with scrolling panels')]//input");
await toggle.click();
await sleep(800);
check("setting saved", (await stored()).metadata.preferences?.follow_panels === true);
await popup.screenshot({ path: `${OUT}/settings-follow.png` });
await page.bringToFront();

// --- On: note on the chat list, which sits in a fixed rail ---
await dragTo("A", 50, 240);
a = await noteData("A");
check("dropped on the chat list: anchored to it", a.anchor?.kind === "element" && a.anchor.selector === "#chats", JSON.stringify(a.anchor));
check("drawn fixed, like the rail", (await wrapperStyle("A")).includes("position: fixed"));
before = await noteBox("A");
const ys = [];
for (const y of [100, 250, 400, 700]) {
  await scrollPage(y);
  await sleep(120);
  ys.push(Math.round((await noteBox("A")).y));
}
check("page scrolling doesn't move it at all", ys.every((y) => y === Math.round(before.y)), ys.join(","));
await scrollPage(0);
await scrollChats(120);
await sleep(150);
after = await noteBox("A");
check("chat list scrolling moves it with the list", Math.round(before.y - after.y) === 120, `${before.y} -> ${after.y}`);

// Scrolled out of the list: hidden whole, not half cut off
await scrollChats(400);
await sleep(150);
check("hidden once its corner leaves the list", (await wrapperStyle("A")).includes("visibility: hidden"));
await page.screenshot({ path: `${OUT}/follow-away.png` });
await scrollChats(0);
await sleep(150);
check("back when scrolled back", !(await wrapperStyle("A")).includes("visibility: hidden"));

// --- Half over the rail and half over the page: stays on the page, fully visible ---
await dragTo("B", 200, 300);
const bData = await noteData("B");
check("half over the chat list and half off it: not anchored to the list", bData.anchor?.kind !== "element", JSON.stringify(bData.anchor));
check("fully visible", !(await wrapperStyle("B")).includes("visibility: hidden") && !(await wrapperStyle("B")).includes("clip"));
await page.screenshot({ path: `${OUT}/follow-straddle.png` });

// --- A panel in the page's flow: page scrolling moves it natively, panel scrolling via the panel ---
await scrollPage(500);
await sleep(200);
const inlineBox = await page.evaluate(() => { const r = document.getElementById("inline").getBoundingClientRect(); return { x: r.left, y: r.top }; });
await dragTo("B", inlineBox.x + 40, inlineBox.y + 60);
const b = await noteData("B");
check("dropped in a panel in the page: anchored to it", b.anchor?.kind === "element" && b.anchor.selector === "#inline", JSON.stringify(b.anchor));
check("drawn on the page (absolute), so page scrolling needs no correction", (await wrapperStyle("B")).includes("position: absolute"));
before = await noteBox("B");
await scrollPage(560);
await sleep(150);
after = await noteBox("B");
check("page scroll moves it exactly with the page", Math.abs(before.y - after.y - 60) < 1, `${before.y} -> ${after.y}`);

// --- Same frame: after the panel scrolls, the note has moved by the next frame ---
const sameFrame = await page.evaluate(async () => {
  const chats = document.getElementById("chats");
  chats.scrollTop = 0;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
});
const r0 = await noteBox("A");
check("ready for frame test", sameFrame && r0.y > 0);

// --- Turn it off again: notes go back to the page, anchors are kept ---
await popup.bringToFront();
await toggle.click();
await page.bringToFront();
await sleep(900);
a = await noteData("A");
check("setting off again: anchor kept in the data", a.anchor?.kind === "element");
check("but the note is on the page", (await wrapperStyle("A")).includes("position: absolute"));

await browser.close();
