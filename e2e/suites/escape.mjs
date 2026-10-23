// Chrome: a note's menu on a web page closes with Escape; keys still don't reach the site
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, backgroundReady, extensionWorker, launchChrome, notesShown } from "../env.mjs";
const WEB = "http://localhost:8765/article.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "esc-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--ignore-certificate-errors", "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1"] });
try {
  await sleep(1500);
  const sw = await extensionWorker(browser);
  await sw.evaluate(async (url) => {
    const { metadata } = await chrome.storage.local.get("metadata");
    await chrome.storage.local.set({ metadata: { ...metadata, onboarded: true }, pages: { [url]: { notes: [{ id: "n1", position: { x: 100, y: 150 }, size: { width: 260 }, title: "A note", body: "Text", date_created: 1, color: "yellow", visible: true, tags: [] }] } }, tags: [] });
  }, WEB);
  const ext = (await browser.targets().find((t) => t.type() === "service_worker").url()).split("/")[2];
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1800);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(WEB); await notesShown(page);
  await sleep(2000);
  await page.evaluate(() => { window.__keys = 0; for (const t of ["keydown", "keyup", "keypress"]) window.addEventListener(t, () => window.__keys++, true); });
  const cdp = await page.createCDPSession();
  const find = async (pred) => {
    const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: true });
    const out = [];
    const walk = (n) => { const a = {}; for (let i = 0; i < (n.attributes || []).length; i += 2) a[n.attributes[i]] = n.attributes[i + 1]; if (pred(a)) out.push({ n, a }); [...(n.children || []), ...(n.shadowRoots || [])].forEach(walk); };
    walk(root);
    return out;
  };
  const [more] = await find((a) => a["aria-label"] === "More options");
  const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: more.n.backendNodeId });
  await page.mouse.click(model.border[0] + 8, model.border[1] + 8);
  await sleep(400);
  const menuOpen = async () => (await find((a) => a.role === "menu")).some(({ a }) => !("hidden" in a));
  check(await menuOpen(), "the note's menu opens");
  await page.keyboard.press("Escape");
  await sleep(300);
  check(!(await menuOpen()), "Escape closes it");
  check((await page.evaluate(() => window.__keys)) === 0, "and the Escape didn't reach the site");
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
