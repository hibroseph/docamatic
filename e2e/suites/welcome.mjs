// The welcome page's practice area: right-click opens the practice menu,
// and Add note puts a practice note where it was clicked.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, launchChrome } from "../env.mjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await launchChrome({
  executablePath: CHROME,
  headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
try {
  const extId = await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1500);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`chrome-extension://${extId}/onboarding.html`);
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/welcome-1.png` });
  const box = await page.evaluate(() => { const b = document.getElementById("practice-area").getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  const at = { x: Math.round(box.x + 60), y: Math.round(box.y + 30) };
  await page.mouse.click(at.x, at.y, { button: "right" });
  await sleep(300);
  check(await page.evaluate(() => document.querySelector(".practice-menu").matches(":popover-open")), "right-click opens the menu");
  await page.screenshot({ path: `${OUT}/welcome-2.png` });
  await page.keyboard.press("Enter");
  await sleep(800);
  const note = await page.evaluate(() => {
    const n = document.getElementById("docamatic-demo").shadowRoot.querySelector(".dm-note");
    const b = n?.getBoundingClientRect(); return b && { x: Math.round(b.x), y: Math.round(b.y) };
  });
  check(note && Math.abs(note.x - at.x) < 4 && Math.abs(note.y - at.y) < 4, `note added at the click ${JSON.stringify(at)} -> ${JSON.stringify(note)}`);
  await page.keyboard.type("Hello");
  await sleep(300);
  await page.screenshot({ path: `${OUT}/welcome-3.png` });
  await page.setViewport({ width: 800, height: 900 });
  await sleep(400);
  await page.screenshot({ path: `${OUT}/welcome-narrow.png` });
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
