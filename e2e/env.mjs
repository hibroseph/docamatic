// Where things are for the browser tests (see e2e/README.md). Everything can
// be overridden with environment variables, which CI sets.
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const posix = (path) => path.split("\\").join("/");

export const ROOT = posix(resolve(here, ".."));
/** The builds under test (npm run build / build:firefox / site:build) */
export const EXT = posix(process.env.DOCAMATIC_EXT || join(ROOT, "dist/chrome-mv3"));
export const EXT_FIREFOX = posix(process.env.DOCAMATIC_EXT_FIREFOX || join(ROOT, "dist/firefox-mv3"));
export const SITE_DIST = posix(process.env.DOCAMATIC_SITE || join(ROOT, "dist/site"));
/** The previous store version's build, for the update test (optional) */
export const OLD_EXT = process.env.DOCAMATIC_OLD_EXT ? posix(process.env.DOCAMATIC_OLD_EXT) : null;

/**
 * The Chrome for Testing version the suites run on (npm run e2e:chrome
 * downloads it). Not the one puppeteer bundles (154): after puppeteer
 * reinstalls an extension, Chrome 154 leaves it unable to receive messages
 * for about 30 seconds (any extension, even an empty one), which breaks every
 * update test. Move this forward once a newer Chrome fixes that.
 */
export const CHROME_BUILD = "148.0.7778.97";
export const CHROME_CACHE = posix(process.env.PUPPETEER_CACHE_DIR || join(homedir(), ".cache/puppeteer"));
/** Chrome: CHROME_PATH, or the pinned Chrome for Testing */
export const CHROME =
  process.env.CHROME_PATH ||
  (await import("@puppeteer/browsers")
    .then(({ Browser, computeExecutablePath }) => computeExecutablePath({ browser: Browser.CHROME, buildId: CHROME_BUILD, cacheDir: CHROME_CACHE }))
    .catch(() => null));
/** Firefox, for the Firefox suite (optional) */
export const FIREFOX = process.env.FIREFOX_PATH || null;

/** Screenshots and other output, not committed */
export const OUT = posix(process.env.E2E_OUT || join(ROOT, "e2e/output"));
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

export const PAGES = posix(join(here, "pages"));
/** The test pages are served here by run.mjs */
export const WEB = "http://localhost:8765";
export const FIXTURES = posix(join(here, "fixtures"));

/** Chrome flags every suite needs on top of its own */
export const CHROME_FLAGS = process.env.CI ? ["--no-sandbox"] : [];

/**
 * Waits until Docamatic's background has loaded the notes (after installing
 * or updating it), instead of a fixed pause: newer Chrome versions take
 * longer to start it again.
 */
export const backgroundReady = async (browser, timeoutMs = 20000) => {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const workers = browser.targets().filter((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"));
    for (const target of workers.reverse()) {
      // A worker that's being replaced can leave these hanging: give up on it quickly
      const ready = await Promise.race([
        target
          .worker()
          .then((worker) => worker?.evaluate(() => self.__DOCAMATIC_READY__ === true))
          .catch(() => false),
        new Promise((resolve) => setTimeout(() => resolve(false), 1500)),
      ]);
      if (ready) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Docamatic's background didn't start");
};

/** The extension's live service worker (not one that's being replaced) */
export const extensionWorker = async (browser, timeoutMs = 20000) => {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const targets = browser.targets().filter((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"));
    for (const target of targets.reverse()) {
      const worker = await Promise.race([
        target
          .worker()
          .then(async (w) => (w && (await w.evaluate(() => true)) ? w : null))
          .catch(() => null),
        new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      if (worker) return worker;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("No live service worker");
};

/**
 * Waits (up to `timeoutMs`) for Docamatic's notes layer to be on the page.
 * Right after an update, newer Chrome versions can load a page before the
 * extension's page script is registered; the page keeps asking for a while.
 * (The notes inside render a moment later; suites that need them wait for
 * them with their own lookups.)
 */
export const notesShown = (page, timeoutMs = 8000) =>
  page.waitForFunction(() => document.querySelector("docamatic-notes"), { timeout: timeoutMs, polling: 100 }).then(
    () => true,
    () => false
  );
