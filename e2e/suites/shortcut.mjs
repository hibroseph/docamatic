// The welcome page and the new note keyboard shortcut: it names the shortcut
// when the browser assigned one, and offers to set one when it didn't.
import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, backgroundReady } from "../env.mjs";
const check = (name, ok, detail = "") => console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "dm-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--host-resolver-rules=MAP *.posthog.com 127.0.0.1, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
try {
  const id = await browser.installExtension(EXT); await backgroundReady(browser);
  await new Promise((r) => setTimeout(r, 1500));
  const page = await browser.newPage();
  await page.goto(`chrome-extension://${id}/onboarding.html`);
  await new Promise((r) => setTimeout(r, 1000));
  const commands = await page.evaluate(async () => (await chrome.commands.getAll()).map((c) => [c.name, c.shortcut]));
  console.log("assigned:", JSON.stringify(commands));
  const shortcut = commands.find(([name]) => name === "create-note")?.[1] || "";
  const step = await page.evaluate(() => document.querySelectorAll(".step p")[1].textContent.replace(/\s+/g, " ").trim());
  const linkShown = await page.evaluate(() => !document.getElementById("shortcut-missing").hidden);
  if (shortcut) {
    check("the welcome page names the shortcut", step.includes(shortcut), step);
    check("and doesn't offer to set one", !linkShown);
  } else {
    check("no shortcut: the welcome page offers to set one", linkShown);
  }
} finally { await browser.close(); }
