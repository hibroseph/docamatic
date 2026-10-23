// Marketplace-like layout: feed (page scroll) -> sticky sidebar, fast drags
// over an iframe, and Find on page.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";

const URL3 = "http://localhost:8765/fb.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (name, ok, detail = "") => console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);

const browser = await launchChrome({
  executablePath: CHROME,
  headless: true,
  pipe: true,
  userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"],
});
const extId = await browser.installExtension(EXT); await backgroundReady(browser);
await sleep(1500);
const mk = (id, x, y) => ({ id, position: { x, y }, size: { width: 240 }, title: id, body: "body", date_created: Date.now() - 86400000, color: { title: "#fff1a3", text: "#1e2433", name: "yellow" }, visible: true });
const ext = await browser.newPage();
await ext.goto(`chrome-extension://${extId}/options.html`);
const sw = await (await extensionWorker(browser));
await sw.evaluate(async (data) => { await chrome.storage.local.clear(); await chrome.storage.local.set(data); }, {
  pages: { [URL3]: { notes: [mk("A", 700, 200), mk("FAR", 700, 3000)] } },
  tags: [],
  metadata: { onboarded: true, schema_version: 1, analytics_enabled: false, preferences: { follow_panels: true } },
});
await browser.installExtension(EXT); await backgroundReady(browser);
await sleep(1000);
const popup = await browser.newPage();
await popup.goto(`chrome-extension://${extId}/popup.html`);
await sleep(800);
const noteData = async (id) => (await popup.evaluate(async () => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })))).pages[URL3].notes.find((n) => n.id === id);

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto(URL3); await notesShown(page);
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
const noteEl = async (id) => (await find((a) => a["data-note-id"] === id && a["data-testid"] === "note"))[0];
const noteBox = async (id) => box((await noteEl(id)).node);
const dragTo = async (id, screenX, screenY, steps = 15) => {
  const notes = (await find((a) => a["data-testid"] === "note")).map((f) => f.a["data-note-id"]);
  const handles = await find((a) => a["data-testid"] === "note-drag-handle");
  const h = await box(handles[notes.indexOf(id)].node);
  await page.mouse.move(h.x + 5, h.y + 8);
  await page.mouse.down();
  await page.mouse.move(screenX + 5, screenY + 8, { steps });
  await page.mouse.up();
  await sleep(900);
};

// 1. Fast drag across the iframe in the feed: the note keeps up
const iframeBox = await page.evaluate(() => { const r = document.querySelector("iframe").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
console.log("iframe", JSON.stringify(iframeBox));
const target = { x: iframeBox.x + 20, y: iframeBox.y + 320 };
await dragTo("A", target.x, target.y, 2);
let b = await noteBox("A");
// The pointer holds the grip, 8px in and 14px down from the note's corner
check("fast drag over an iframe: the note ends under the pointer", Math.abs(b.x + 8 - target.x) < 3 && Math.abs(b.y + 14 - target.y) < 3, `${Math.round(b.x)},${Math.round(b.y)} want ${Math.round(target.x)},${Math.round(target.y)}`);

// 2. From the feed to the sticky sidebar under the search box
await page.evaluate(() => window.scrollTo(0, 300));
await sleep(200);
await dragTo("A", 40, 220);
let a = await noteData("A");
check("dropped on the sidebar: anchored to it, by a stable attribute", a.anchor?.kind === "element" && a.anchor.selector.includes('aria-label="Marketplace sidebar"'), JSON.stringify(a.anchor));
const before = await noteBox("A");
const ys = [];
for (const y of [0, 150, 600, 1200, 400]) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await sleep(150);
  ys.push(Math.round((await noteBox("A")).y));
}
check("page scrolling: stays with the sticky sidebar", ys.every((y) => Math.abs(y - before.y) <= 1), `${Math.round(before.y)} vs ${ys.join(",")}`);
await page.screenshot({ path: `${OUT}/fb-sidebar.png` });

// 3. Back to the feed: scrolls with the page again
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(200);
await dragTo("A", 700, 300);
a = await noteData("A");
check("dropped back on the feed: on the page again", !a.anchor, JSON.stringify(a.anchor));
const feedBefore = await noteBox("A");
await page.evaluate(() => window.scrollTo(0, 250));
await sleep(200);
b = await noteBox("A");
check("and scrolls with the page", Math.abs(feedBefore.y - b.y - 250) < 1, `${feedBefore.y} -> ${b.y}, scrollY ${await page.evaluate(() => scrollY)}`);

// 4. Find on page: a note far down the page
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(200);
const reply = await popup.evaluate((url) => chrome.runtime.sendMessage({ type: "find_note", noteId: "FAR", pageUrl: url }), URL3);
await sleep(1500);
const far = await noteBox("FAR");
check("Find on page answers", reply?.ok === true, JSON.stringify(reply));
check("scrolled to the note", far.y > 0 && far.y < 800, `note at y ${Math.round(far.y)}`);
check("note is outlined", (await noteEl("FAR")).a.class.includes("is-found"));
await page.screenshot({ path: `${OUT}/fb-found.png` });

// 5. Find on page for a note whose panel is gone: back on the page
await popup.evaluate(async (url) => {
  const { pages } = await chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }));
  return url;
}, URL3);
await page.evaluate(() => window.scrollTo(0, 0));
await dragTo("A", 40, 220);
await page.evaluate(() => document.querySelector(".side").remove());
await sleep(800);
await popup.evaluate((url) => chrome.runtime.sendMessage({ type: "find_note", noteId: "A", pageUrl: url }), URL3);
await sleep(1200);
a = await noteData("A");
check("panel gone: Find on page puts the note back on the page", !a.anchor, JSON.stringify(a.anchor));
const aBox = await noteBox("A");
check("and it's on screen", aBox.y > -50 && aBox.y < 800, `${Math.round(aBox.y)}`);

// 6. Find on page when the page isn't open: opens it
await page.close();
const reply2 = await popup.evaluate((url) => chrome.runtime.sendMessage({ type: "find_note", noteId: "FAR", pageUrl: url }), URL3);
check("page not open: opens it and finds the note", reply2?.ok === true, JSON.stringify(reply2));

await browser.close();
