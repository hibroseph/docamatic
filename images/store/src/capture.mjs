// Captures the real extension UI for the Chrome Web Store images.
// Serves the repo on :8790; writes PNGs to images/store/src/raw/.
import puppeteer from "puppeteer-core";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = "C:/Users/iwill/source/repos/JoeStash/projects/sticky-notes";
const EXT = `${REPO}/dist/chrome-mv3`;
const RAW = `${REPO}/images/store/src/raw`;
mkdirSync(RAW, { recursive: true });
const ARTICLE = "https://slowbread.blog/sourdough-step-by-step";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const day = 86400000;
const now = Date.now();
const color = (name) => ({ name, title: { yellow: "#fff1a3", pink: "#ffd9ea", blue: "#d6ecff", green: "#ddf6d8", orange: "#ffe2c4", purple: "#e9e0ff" }[name], text: "#1e2433" });
const note = (id, x, y, width, c, title, body, tags, extra = {}) => ({ id, position: { x, y }, size: { width }, title, body, date_created: extra.created || now - 2 * day, color: color(c), visible: true, heart: false, tags: tags.map((t) => ({ id: t })), ...extra });

const seed = {
  pages: {
    [ARTICLE]: {
      title: "A beginner's sourdough, step by step",
      notes: [
        note("n1", 930, 150, 250, "yellow", "Feed the starter", "9 pm the night before.<br>Ready when it has doubled: 4 to 6 hours.", ["baking"], { created: now - 3 * 3600000 }),
        note("n2", 36, 290, 236, "pink", "Next time", "Try 75% water and a longer cold proof in the fridge.", ["baking", "try"], { heart: true, created: now - 1 * day }),
        note("n3", 945, 360, 230, "green", "Shopping list", "Rye flour, a banneton, rice flour for dusting.", [], { created: now - 26 * 3600000 }),
      ],
    },
    // The right-click picture: a note made from the selected sentence
    "https://slowbread.blog/sourdough-for-beginners": {
      title: "A beginner's sourdough, step by step",
      notes: [note("s1", 905, 330, 260, "yellow", "Starter", "Feed your starter the night before.", [], { created: now - 20000 })],
    },
    "https://www.example-travel.com/kyoto-in-three-days": { title: "Kyoto in three days", notes: [note("t1", 0, 0, 240, "blue", "Tea ceremony", "Book two weeks ahead. Ask for the English session.", ["travel"], { created: now - 5 * day, heart: true })] },
    "https://www.youtube.com/watch?v=shape-a-boule": { title: "How to shape a boule (video)", notes: [note("y1", 0, 0, 240, "orange", null, "2:40, the tension pull. Watch again before baking.", ["baking"], { created: now - 6 * day })] },
    "https://docs.example.com/q3-planning": { title: "Q3 planning", notes: [note("w1", 0, 0, 240, "green", "Before Tuesday", "Ask Sam for the budget numbers.", ["work"], { created: now - 8 * day })] },
    "https://www.amazon.com/dp/B0DUTCHOVN": { title: "Cast iron Dutch oven, 5 qt", notes: [note("a1", 0, 0, 240, "purple", null, "Compare with the 6 qt one before buying.", ["try"], { created: now - 9 * day })] },
    "https://en.wikipedia.org/wiki/Spaced_repetition": { title: "Spaced repetition - Wikipedia", notes: [note("l1", 0, 0, 240, "yellow", "Review intervals", "1 day, 3 days, a week, a month.", ["learning"], { created: now - 12 * day, heart: true })] },
  },
  tags: [
    { id: "baking", text: "baking", color: "#ffd84d", notes: ["n1", "n2", "y1"] },
    { id: "try", text: "to try", color: "#ff9ec4", notes: ["n2", "a1"] },
    { id: "travel", text: "travel", color: "#8fc8ff", notes: ["t1"] },
    { id: "work", text: "work", color: "#9de5a0", notes: ["w1"] },
    { id: "learning", text: "learning", color: "#c7b3ff", notes: ["l1"] },
  ],
  metadata: { onboarded: true, schema_version: 1, analytics_enabled: false },
};

const browser = await puppeteer.launch({
  executablePath: "C:/Users/iwill/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe",
  headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: ["--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1", "--hide-scrollbars"],
});
try {
  const extId = await browser.installExtension(EXT);
  await sleep(1500);
  const ext = await browser.newPage();
  await ext.goto(`chrome-extension://${extId}/options.html`);
  const sw = await (await browser.waitForTarget((t) => t.type() === "service_worker")).worker();
  await sw.evaluate(async (data) => { await chrome.storage.local.clear(); await chrome.storage.local.set(data); }, seed);
  await browser.installExtension(EXT);
  await sleep(1200);

  // The article with notes
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 760, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  // The demo article, answered by the browser itself for slowbread.blog (a made-up domain)
  const articleHtml = readFileSync(`${REPO}/images/store/src/article.html`, "utf8");
  await page.setRequestInterception(true);
  page.on("request", (r) => (r.url().startsWith("https://slowbread.blog/") ? r.respond({ status: 200, contentType: "text/html", body: articleHtml }) : r.continue()));
  await page.goto(ARTICLE);
  await sleep(2500);
  await page.mouse.move(600, 740);
  await page.screenshot({ path: `${RAW}/page.png` });
  // A note being picked up (hover lift)
  await page.mouse.move(1060, 262);
  await sleep(400);
  await page.screenshot({ path: `${RAW}/page-hover.png` });

  // The popup, as if opened over the article
  const popupShot = async (name, { theme = "light", setup } = {}) => {
    const popup = await browser.newPage();
    await popup.evaluateOnNewDocument((url) => {
      const query = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = (q, ...rest) => (q && q.active ? query({ url }, ...rest) : query(q, ...rest));
      // No shortcut hint in the button for these pictures (the test profile has none set anyway)
    }, ARTICLE);
    await popup.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    await popup.setViewport({ width: 380, height: 560, deviceScaleFactor: 2 });
    await popup.goto(`chrome-extension://${extId}/popup.html`);
    await sleep(1800);
    if (setup) await setup(popup);
    await sleep(500);
    await popup.screenshot({ path: `${RAW}/${name}.png` });
    await popup.close();
  };
  await popupShot("popup-thispage");
  await popupShot("popup-search", {
    setup: async (p) => {
      await p.click('[data-testid="search-input"]');
      await p.keyboard.type("sourdugh starter");
      await p.click(".wordmark");
    },
  });
  await popupShot("popup-tags", { setup: (p) => p.click('[data-testid="popup-nav-tags"]') });
  await popupShot("popup-all-dark", { theme: "dark", setup: (p) => p.click('[data-testid="popup-nav-sort"]') });
  await popupShot("popup-favorites", { setup: (p) => p.click('[data-testid="popup-nav-hearted"]') });
  // The right-click picture: a real selection, and the note made from it
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1200, height: 760, deviceScaleFactor: 2 });
  await page2.setRequestInterception(true);
  page2.on("request", (r) => (r.url().startsWith("https://slowbread.blog/") ? r.respond({ status: 200, contentType: "text/html", body: articleHtml }) : r.continue()));
  await page2.goto("https://slowbread.blog/sourdough-for-beginners");
  await sleep(2000);
  await page2.evaluate(() => {
    window.scrollTo(0, 250);
    const p = [...document.querySelectorAll("p")].find((el) => el.textContent.includes("Feed your starter"));
    const text = p.firstChild;
    const start = text.textContent.indexOf("Feed your starter");
    const range = document.createRange();
    range.setStart(text, start);
    range.setEnd(text, start + "Feed your starter the night before".length);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
  });
  await sleep(500);
  const selection = await page2.evaluate(() => {
    const rects = [...getSelection().getRangeAt(0).getClientRects()];
    const last = rects[rects.length - 1];
    return { x: Math.round(last.right), y: Math.round(last.bottom) };
  });
  console.log("selection ends at", JSON.stringify(selection));
  await page2.screenshot({ path: `${RAW}/page-plain.png` });
  console.log("captured");
} finally {
  await browser.close();
}
