// 5.0.3: a tab open during an update keeps working notes without a reload;
// notes saved off the left/top edge are drawn on screen.
// Usage: node updatetabs.mjs <old dist> <new dist>
import { mkdtempSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, OLD_EXT, OUT, EXT as BUILD, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
// The previous store version's build (DOCAMATIC_OLD_EXT), updated to this one
if (!OLD_EXT) {
  console.log("SKIP no previous version to update from (set DOCAMATIC_OLD_EXT)");
  process.exit(0);
}
const [OLD, NEW] = [OLD_EXT, BUILD];
const NEW_VERSION = JSON.parse(readFileSync(join(NEW, "manifest.json"), "utf8")).version;
const PAGE = "http://localhost:8765/article.html";
const EXT = join(mkdtempSync(join(tmpdir(), "upd-")), "ext").split("\\").join("/");
cpSync(OLD, EXT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "updp-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
const worker = () => extensionWorker(browser);
const note = (id, x, y, body) => ({ id, position: { x, y }, size: { width: 240 }, title: id, body, date_created: Date.now() - 86400000, color: { title: "#fff1a3", text: "#000" }, visible: true, tags: [] });
try {
  await sleep(1500);
  let sw = await worker();
  await sw.evaluate(async (pages) => {
    const { metadata } = await chrome.storage.local.get("metadata");
    await chrome.storage.local.set({ pages, metadata: { ...metadata, onboarded: true, analytics_enabled: false } });
  }, { [PAGE]: { notes: [note("n1", 100, 150, "first"), note("n3", -300, -50, "off the edge")] } });
  await browser.installExtension(EXT); // restart so the seeded notes load (the old build has no readiness flag)
  await sleep(2000);

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(PAGE); await notesShown(page);
  await sleep(2500);
  const roots = () => page.evaluate(() => [...document.querySelectorAll("docamatic-notes")].map((e) => [e.id, getComputedStyle(e).display]));
  console.log("before update:", JSON.stringify(await roots()));

  // The update, with the tab left open
  rmSync(EXT, { recursive: true, force: true });
  cpSync(NEW, EXT, { recursive: true });
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(4000);
  const after = await roots();
  console.log("after update:", JSON.stringify(after));
  const visible = after.filter(([, display]) => display !== "none");
  check(visible.length === 1 && visible[0][0].includes(NEW_VERSION), `one notes layer is shown, the new version's (${NEW_VERSION})`);

  const cdp = await page.createCDPSession();
  const shown = async () => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const found = [];
    const walk = (node) => {
      const attrs = {};
      for (let i = 0; i < (node.attributes || []).length; i += 2) attrs[node.attributes[i]] = node.attributes[i + 1];
      if (attrs["data-testid"]) found.push({ node, attrs });
      for (const child of [...(node.children || []), ...(node.shadowRoots || [])]) walk(child);
    };
    walk(root);
    const out = [];
    for (const f of found) {
      try {
        const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: f.node.backendNodeId });
        if (model.width > 0) out.push({ id: f.attrs["data-testid"], note: f.attrs["data-note-id"], x: model.border[0], y: model.border[1], w: model.width, h: model.height });
      } catch {}
    }
    return out;
  };
  const items = await shown();
  const notes = items.filter((i) => i.id === "note");
  check(notes.length === 2, `both notes are shown (${notes.map((n) => n.note)})`);
  check(!items.some((i) => i.id === "note-sync-error"), "no Sync Error box");
  const off = notes.find((n) => n.note === "n3");
  check(off && off.x >= 0 && off.y >= 0, `a note saved at (-300, -50) is drawn on screen (${off && [Math.round(off.x), Math.round(off.y)]})`);

  // Editing in the open tab saves
  const body = items.find((i) => i.id === "note-body" && i.note === "n1") || items.filter((i) => i.id === "note-body").find((b) => { const n = notes.find((x) => x.note === "n1"); return n && b.y > n.y && b.y < n.y + n.h; });
  if (body) {
    await page.mouse.click(body.x + 20, body.y + 10);
    await page.keyboard.press("End");
    await page.keyboard.type(" and edited after the update");
    await sleep(1500);
  }
  sw = await worker();
  const saved = await sw.evaluate(async (url) => (await chrome.storage.local.get(null).then((s) => ({ ...s, pages: { ...s.pages, ...Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("page:")).map(([k, v]) => [k.slice(5), v])) } }))).pages[url].notes.find((n) => n.id === "n1").body, PAGE);
  check(saved.includes("edited after the update"), `typing in the open tab after the update is saved (${saved})`);
  // The notes were converted to the per-page layout (schema version 2)
  const layout = await sw.evaluate(async () => {
    const s = await chrome.storage.local.get(null);
    return { oldKey: "pages" in s, pageKeys: Object.keys(s).filter((k) => k.startsWith("page:")).length, version: s.metadata?.schema_version };
  });
  check(!layout.oldKey && layout.pageKeys > 0 && layout.version === 2, `the notes are stored per page now (${JSON.stringify(layout)})`);
  const backups = await sw.evaluate(async () => ((await chrome.storage.local.get("backups")).backups || []).map((b) => b.reason));
  check(backups.includes("before-update"), `with a backup of the 5.0 data first (${backups.join(",")})`);
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
