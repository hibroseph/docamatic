// Collapsing a note to its title bar and opening it again.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
const URL = "http://localhost:8765/article.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
try {
  // Loaded once (--load-extension): reinstalling here would leave two
  // workers that both answer the new note request, with different notes
  await backgroundReady(browser);
  const extId = (await extensionWorker(browser)).url().split("/")[2];
  await sleep(1500);
  const ext = await browser.newPage();
  await ext.goto(`chrome-extension://${extId}/options.html`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(URL); await notesShown(page);
  await sleep(1200);
  const tabId = await ext.evaluate(async (url) => (await chrome.tabs.query({ url }))[0].id, URL);
  const { noteId } = await ext.evaluate((tabId) => chrome.runtime.sendMessage({ type: "create_note", tabId, placement: "page", source: "popup" }), tabId);
  await page.bringToFront();
  await sleep(1000);
  await page.keyboard.type("Some text in the note");
  await sleep(600);
  const cdp = await page.createCDPSession();
  // Finds the button in the closed shadow root and returns its center and opacity
  const button = async () => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "*" });
    const find = (n) => { if (n.attributes?.includes("note-collapse")) return n; for (const c of [...(n.children || []), ...(n.shadowRoots || [])]) { const f = find(c); if (f) return f; } };
    const node = find(root);
    const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: node.backendNodeId });
    const q = model.content; return { x: (q[0] + q[4]) / 2, y: (q[1] + q[5]) / 2 };
  };
  const collapsed = async () => (await ext.evaluate(async () => (await chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }))).pages)).constructor && Object.values(await ext.evaluate(async () => (await chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }))).pages)).flatMap((p) => p.notes).find((n) => n.id === noteId).collapsed;
  // Move away first: hidden until hovered
  await page.mouse.move(5, 790);
  await sleep(300);
  const b = await button();
  await page.screenshot({ path: `${OUT}/collapse-0.png`, clip: { x: b.x - 260, y: b.y - 30, width: 320, height: 140 } });
  await page.mouse.move(b.x, b.y);
  await sleep(300);
  await page.screenshot({ path: `${OUT}/collapse-1.png`, clip: { x: b.x - 260, y: b.y - 30, width: 320, height: 140 } });
  await page.mouse.click(b.x, b.y);
  await sleep(1200);
  check((await collapsed()) === true, "one click collapses the note");
  await page.mouse.move(5, 790);
  await sleep(300);
  await page.screenshot({ path: `${OUT}/collapse-2.png`, clip: { x: b.x - 260, y: b.y - 30, width: 320, height: 140 } });
  const b2 = await button();
  await page.mouse.click(b2.x, b2.y);
  await sleep(1200);
  check((await collapsed()) === false, "one more click expands it");
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
