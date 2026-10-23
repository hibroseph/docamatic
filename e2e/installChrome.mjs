// Downloads the Chrome for Testing version the browser tests run on (see
// CHROME_BUILD in env.mjs), if it isn't there yet.
import { Browser, install } from "@puppeteer/browsers";
import { CHROME_BUILD, CHROME_CACHE } from "./env.mjs";

const installed = await install({ browser: Browser.CHROME, buildId: CHROME_BUILD, cacheDir: CHROME_CACHE });
console.log(`Chrome ${CHROME_BUILD}: ${installed.executablePath}`);
