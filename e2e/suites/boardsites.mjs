// The board grouped by website: the site groups, rearranging notes there
// without disturbing the tag arrangement, and the grouping remembered.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, launchChrome } from "../env.mjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
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
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`chrome-extension://${extId}/board.html`);
  await sleep(1200);
  const tagSpot = await page.$eval('[data-note-id="n5"]', (e) => e.style.transform);
  await page.click('[data-testid="board-group-by-site"]');
  await sleep(500);
  const groups = await page.$$eval(".board-group", (els) => els.map((e) => e.getAttribute("aria-label")));
  console.log("site groups:", groups.join(" | "));
  check(JSON.stringify(groups) === JSON.stringify(["slowbread.blog", "github.com", "youtube.com", "amazon.com", "news.example.com"]), "grouped by website, busiest first");
  await page.screenshot({ path: `${OUT}/board-sites-canvas.png` });
  // Drag a note while grouped by website
  const box = await page.$eval('[data-note-id="n5"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 60, y: r.y + 100 }; });
  await page.mouse.move(box.x, box.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + i * 30, box.y + i * 20);
  await page.mouse.up(); await sleep(500);
  const siteSpot = await page.$eval('[data-note-id="n5"]', (e) => e.style.transform);
  await page.click('[data-testid="board-group-by-tag"]');
  await sleep(500);
  check(await page.$eval('[data-note-id="n5"]', (e) => e.style.transform) === tagSpot, "the tag arrangement isn't changed by moving notes in the website one");
  await page.reload(); await sleep(1200);
  check((await page.$$eval(".board-group", (els) => els[0].getAttribute("aria-label"))) === "baking", "grouping is remembered (tag)");
  await page.click('[data-testid="board-group-by-site"]');
  await sleep(500);
  check(await page.$eval('[data-note-id="n5"]', (e) => e.style.transform) === siteSpot, "and the website arrangement is kept too");
  check((await page.$eval(".board-toolbar .dm-btn--sm:last-child", (e) => e.textContent)) === "Arrange by website", "Arrange follows the grouping");
  // By site view
  await page.evaluate(() => [...document.querySelectorAll(".board-tabs .dm-tab")].find((b) => b.textContent === "By site").click());
  await sleep(500);
  const sites = await page.$$eval(".site-section", (els) => els.map((e) => [e.getAttribute("aria-label"), e.querySelectorAll(".site-page").length, e.querySelectorAll("[data-note-id]").length]));
  console.log("sites:", JSON.stringify(sites));
  check(sites.length === 5 && JSON.stringify(sites[0]) === JSON.stringify(["Website slowbread.blog", 1, 3]), "By site: a section per website, its pages and notes");
  const pageTitle = await page.$eval(".site-page__title a", (e) => [e.textContent, e.getAttribute("href"), e.getAttribute("target")]);
  check(pageTitle[0] === "A beginner's sourdough" && pageTitle[1] === "https://slowbread.blog/sourdough" && pageTitle[2] === "_blank", `each page's title links to it (${pageTitle})`);
  await page.type('[data-testid="board-search"]', "redirect");
  await sleep(400);
  check((await page.$$eval(".site-section", (els) => els.map((e) => e.getAttribute("aria-label")))).join() === "Website github.com", "search narrows it down");
  await page.click(".board-search__clear");
  await sleep(300);
  await page.screenshot({ path: `${OUT}/board-sites.png`, fullPage: true });
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
