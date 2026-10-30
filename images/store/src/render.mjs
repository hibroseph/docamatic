// Renders images/store/src/*.html to the exact store sizes as JPEG (no alpha).
import puppeteer from "puppeteer-core";
const REPO = "C:/Users/iwill/source/repos/JoeStash/projects/sticky-notes";
const OUT = `${REPO}/images/store`;
const SIZES = {
  "tile-small": [440, 280, "small-promo-tile-440x280"],
  marquee: [1400, 560, "marquee-promo-tile-1400x560"],
  "shot-1-notes": [1280, 800, "screenshot-1-notes-1280x800"],
  "shot-2-search": [1280, 800, "screenshot-2-search-1280x800"],
  "shot-3-tags": [1280, 800, "screenshot-3-tags-1280x800"],
  "shot-4-rightclick": [1280, 800, "screenshot-4-right-click-1280x800"],
  "shot-5-yours": [1280, 800, "screenshot-5-private-1280x800"],
};
const browser = await puppeteer.launch({ executablePath: "C:/Users/iwill/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe", headless: true });
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
for (const [name, [w, h, file]] of Object.entries(SIZES)) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:8790/images/store/src/${name}.html`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family).join(","));
  await page.screenshot({ path: `${OUT}/${file}.jpg`, type: "jpeg", quality: 94, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(file, w, h, "fonts:", fonts);
}
await browser.close();
