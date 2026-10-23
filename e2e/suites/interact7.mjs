// Infinite scroll page: off-screen status, Bring here, Keep on screen,
// collapse, corner resize, right-click spot, and the popup showing it.
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, notesShown } from "../env.mjs";

const URLI = "http://localhost:8765/infinite.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (name, ok, detail = "") => console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"],
});
try {
  const extId = await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1500);
  const ext = await browser.newPage();
  await ext.goto(`chrome-extension://${extId}/options.html`);
  const sw = await (await extensionWorker(browser));
  const mk = (id, x, y, title) => ({ id, position: { x, y }, size: { width: 240 }, title, body: "Remember this post", date_created: Date.now() - 86400000, color: { name: "yellow", title: "#fff1a3", text: "#1e2433" }, visible: true });
  await sw.evaluate(async (data) => { await chrome.storage.local.clear(); await chrome.storage.local.set(data); }, {
    pages: { [URLI]: { title: "Endless Feed", notes: [mk("FAR", 700, 4200, "Way down the feed"), mk("TOP", 60, 120, "Near the top")] } },
    tags: [], metadata: { onboarded: true, schema_version: 1, analytics_enabled: false },
  });
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1000);
  const ext2 = await browser.newPage();
  await ext2.goto(`chrome-extension://${extId}/options.html`);
  const stored = async (id) => (await ext2.evaluate(async () => chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } })))).pages[URLI].notes.find((n) => n.id === id);

  const page = await browser.newPage();
  page.on("console", (m) => m.text().includes("DM-DEBUG") && console.log(m.text()));
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(URLI); await notesShown(page);
  await sleep(2000);
  const tabId = await ext2.evaluate(async (url) => (await chrome.tabs.query({ url }))[0].id, URLI);
  const ask = (msg) => ext2.evaluate((tabId, msg) => chrome.tabs.sendMessage(tabId, msg), tabId, msg);

  const docHeight = await page.evaluate(() => document.body.offsetHeight);
  console.log("feed loaded so far:", docHeight, "px; note saved at y 4200");
  let reply = await ask({ action: "note_places" });
  check("the page says where its notes are", reply?.places?.FAR === "below" && reply?.places?.TOP === "visible", JSON.stringify(reply?.places));

  // The popup's "This page", pointed at the feed tab (as if opened over it)
  const popup = await browser.newPage();
  await popup.evaluateOnNewDocument((url) => {
    const query = chrome.tabs.query.bind(chrome.tabs);
    chrome.tabs.query = (q, ...rest) => (q && q.active ? query({ url }, ...rest) : query(q, ...rest));
  }, URLI);
  await popup.setViewport({ width: 380, height: 560 });
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await sleep(2500);
  const chip = await popup.$eval('[data-testid="note-place"]', (el) => el.textContent).catch(() => null);
  check("the popup says the note is further down", chip?.includes("Further down the page") && chip.includes("Bring here"), chip);
  await popup.screenshot({ path: `${OUT}/popup-place.png` });

  // Bring here
  await page.bringToFront();
  reply = await ask({ action: "bring_note_here", noteId: "FAR" });
  await sleep(1200);
  const far = await stored("FAR");
  check("Bring here moves it to what's on screen", reply?.found && far.position.y < 800 && far.position.x > 900, JSON.stringify(far.position));
  reply = await ask({ action: "note_places" });
  check("and now it's on screen", reply?.places?.FAR === "visible", JSON.stringify(reply?.places));
  await page.screenshot({ path: `${OUT}/bring-here.png` });

  // The notes on the page, through the shadow root
  const cdp = await page.createCDPSession();
  const nodes = async (pred) => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const found = [];
    const walk = (n) => {
      const a = {};
      for (let i = 0; i < (n.attributes || []).length; i += 2) a[n.attributes[i]] = n.attributes[i + 1];
      if (pred(a)) found.push({ node: n, a });
      for (const c of [...(n.children || []), ...(n.shadowRoots || [])]) walk(c);
    };
    walk(root);
    return found;
  };
  const box = async (node) => {
    const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: node.backendNodeId });
    return { x: model.border[0], y: model.border[1], w: model.border[4] - model.border[0], h: model.border[5] - model.border[1] };
  };
  const clickIn = async (node) => {
    const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: node.backendNodeId });
    await cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: "function(){ this.click() }" });
  };
  const noteEl = async (id) => (await nodes((a) => a["data-testid"] === "note" && a["data-note-id"] === id))[0];
  const menuItem = async (id, label) => {
    const note = await noteEl(id);
    const all = await nodes((a) => a.role === "menuitem");
    // Items of this note's menu: the ones inside its article
    for (const item of all) {
      const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: item.node.backendNodeId });
      const { result } = await cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, returnByValue: true, functionDeclaration: `function(){ return this.closest('[data-note-id]')?.dataset.noteId === ${JSON.stringify(id)} && this.textContent.includes(${JSON.stringify(label)}) }` });
      if (result.value) return item;
    }
    return null;
  };

  // Keep on screen
  await clickIn((await menuItem("TOP", "Keep on screen")).node);
  await sleep(900);
  let top = await stored("TOP");
  check("Keep on screen saves it pinned", top.stickify === true, JSON.stringify({ stickify: top.stickify, position: top.position }));
  const before = await box((await noteEl("TOP")).node);
  await page.evaluate(() => window.scrollTo(0, 900));
  await sleep(300);
  const scrolled = await page.evaluate(() => scrollY);
  const after = await box((await noteEl("TOP")).node);
  check("it stays put while the page scrolls", Math.abs(after.y - before.y) < 1, `${before.y} -> ${after.y}`);
  await page.screenshot({ path: `${OUT}/pinned.png` });
  await clickIn((await menuItem("TOP", "Scroll with the page")).node);
  await sleep(900);
  top = await stored("TOP");
  check("unpinned: back on the page where it was showing", top.stickify === false && Math.abs(top.position.y - (after.y + scrolled)) < 2, JSON.stringify(top.position));
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);

  // Collapse by double-clicking the top bar
  const grip = (await nodes((a) => a["data-testid"] === "note-drag-handle"))[0];
  const g = await box(grip.node);
  const full = await box((await noteEl("FAR")).node).catch(() => null);
  const topBox = await box((await noteEl("TOP")).node);
  const topGrip = await box((await nodes((a) => a["data-testid"] === "note-drag-handle"))[1].node);
  const hit = await cdp.send("DOM.getNodeForLocation", { x: Math.round(topGrip.x + 5), y: Math.round(topGrip.y + 8), includeUserAgentShadowDOM: false, ignorePointerEventsNone: true });
  const desc = await cdp.send("DOM.describeNode", { backendNodeId: hit.backendNodeId });
  console.log("under the click:", desc.node.nodeName, JSON.stringify(desc.node.attributes));
  await page.evaluate(() => (document.documentElement.dataset.dm = ""));
  await page.mouse.click(topGrip.x + 5, topGrip.y + 8);
  await sleep(150);
  await page.mouse.click(topGrip.x + 5, topGrip.y + 8);
  await sleep(900);
  console.log("events:", await page.evaluate(() => document.documentElement.dataset.dm));
  top = await stored("TOP");
  const collapsedBox = await box((await noteEl("TOP")).node);
  check("double-clicking the grip collapses it", top.collapsed === true && collapsedBox.h < topBox.h, `${Math.round(topBox.h)} -> ${Math.round(collapsedBox.h)}, collapsed=${top.collapsed}, grip at ${Math.round(topGrip.x)},${Math.round(topGrip.y)}, note at ${Math.round(topBox.x)},${Math.round(topBox.y)}`);
  await page.mouse.click(topGrip.x + 5, topGrip.y + 8);
  await sleep(150);
  await page.mouse.click(topGrip.x + 5, topGrip.y + 8);
  await sleep(900);
  top = await stored("TOP");
  check("and again expands it", top.collapsed === false, String(top.collapsed));

  // Height from the corner (the second note in the page is TOP)
  const corner = (await nodes((a) => (a.class || "") === "note__corner"))[1];
  const c = await box(corner.node);
  await page.mouse.move(c.x + 8, c.y + 8);
  await page.mouse.down();
  await page.mouse.move(c.x + 48, c.y + 108, { steps: 8 });
  await page.mouse.up();
  await sleep(900);
  top = await stored("TOP");
  check("dragging the corner sets width and height", top.size.height > 150 && top.size.width > 260, JSON.stringify(top.size));

  // Right-click spot is remembered for "Add a note here"
  await page.mouse.click(400, 500, { button: "right" });
  await sleep(200);
  const info = await ask({ action: "get_page_information" });
  check("the right-clicked spot is known to the page script", info?.contextMenuAt && Math.abs(info.contextMenuAt.x - 400) < 2, JSON.stringify(info?.contextMenuAt));
  await page.keyboard.press("Escape");
  await page.screenshot({ path: `${OUT}/layout.png` });
} finally {
  await browser.close();
}
