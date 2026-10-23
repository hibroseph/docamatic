// The website's contact form, served as the published site; PostHog is answered here, nothing is sent.
// Usage: node contactform.mjs <built site folder> <out folder>
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { gunzipSync } from "node:zlib";
import { CHROME, OUT, SITE_DIST } from "../env.mjs";
const DIST = SITE_DIST;
const SITE = "https://hibroseph.github.io/docamatic/";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, pipe: true });
const captured = [];
let captureStatus = 200;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  await page.setUserAgent((await browser.userAgent()).replace("HeadlessChrome", "Chrome"));
  await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.href.startsWith(SITE)) {
      const file = url.pathname.replace("/docamatic/", "") || "index.html";
      try { return req.respond({ status: 200, contentType: TYPES[extname(file)] || "application/octet-stream", body: readFileSync(join(DIST, file)) }); } catch { return req.respond({ status: 404, body: "" }); }
    }
    if (url.hostname.endsWith("posthog.com")) {
      const cors = { "Access-Control-Allow-Origin": "https://hibroseph.github.io", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "content-type" };
      if (req.method() === "OPTIONS") return req.respond({ status: 200, headers: cors, body: "" });
      const raw = req.postData() || "";
      let body = raw;
      try { body = gunzipSync(Buffer.from(raw, "binary")).toString(); } catch {}
      try { const parsed = JSON.parse(body); (Array.isArray(parsed) ? parsed : parsed.batch || [parsed]).forEach((e) => captured.push(e)); } catch {}
      const isContact = body.includes("contact_form_submitted");
      return req.respond({ status: isContact ? captureStatus : 200, contentType: "application/json", headers: cors, body: "{}" });
    }
    return req.respond({ status: 204, body: "" });
  });
  const contact = () => captured.filter((e) => e.event === "contact_form_submitted");
  const status = () => page.$eval("[data-status]", (e) => [e.dataset.state, e.textContent]);
  await page.goto(SITE + "contactus.html", { waitUntil: "load" });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/contact-form.png`, fullPage: true });

  // Too fast (a bot): looks sent, nothing sent
  await page.type("#contact-message", "spam");
  await page.click("button[type=submit]");
  await sleep(300);
  check((await status())[0] === "sent" && contact().length === 0, "sent within 3 seconds of opening: treated as a bot, nothing sent");
  await sleep(3000);

  // Empty, and a bad email
  await page.click("button[type=submit]");
  await sleep(200);
  check((await status())[0] === "invalid", "an empty message isn't sent");
  await page.type("#contact-message", "Hello");
  await page.type("#contact-email", "not-an-email");
  await page.click("button[type=submit]");
  await sleep(200);
  check((await status())[0] === "invalid" && contact().length === 0, "nor one with an email that isn't one");

  // The hidden field filled in (a bot)
  await page.$eval("#contact-email", (e) => (e.value = ""));
  await page.$eval("#contact-website", (e) => (e.value = "http://spam.example"));
  await page.click("button[type=submit]");
  await sleep(300);
  check(contact().length === 0, "the hidden field filled in: nothing sent");

  // A real message
  await page.$eval("#contact-website", (e) => (e.value = ""));
  await page.click('input[name=topic][value="idea"]');
  await page.type("#contact-message", "Please add notes that show on every page of a site.");
  await page.type("#contact-email", "someone@example.com");
  await page.click("button[type=submit]");
  await sleep(1000);
  const sent = contact()[0];
  console.log("sent:", JSON.stringify(sent && { ...sent.properties, api_key: sent.api_key ? "(set)" : "(missing)", distinct_id: sent.distinct_id ? "(set)" : "(missing)" }));
  check(sent && sent.properties.message === "Please add notes that show on every page of a site." && sent.properties.email === "someone@example.com" && sent.properties.topic === "idea" && sent.properties.$process_person_profile === false, "a real message is sent to PostHog with its topic and email");
  const st = await status();
  check(st[0] === "sent" && /reply by email/.test(st[1]), `and it says so (${st[1]})`);
  check((await page.$eval("#contact-message", (e) => e.value)) === "", "the form is cleared");
  await page.screenshot({ path: `${OUT}/contact-sent.png` });

  // PostHog unreachable
  captureStatus = 500;
  await page.type("#contact-message", "Second message");
  await page.click("button[type=submit]");
  await sleep(1000);
  const failed = await status();
  check(failed[0] === "failed" && /sticknoteapp@gmail\.com/.test(failed[1]) && (await page.$eval("#contact-message", (e) => e.value)) === "Second message", "if it doesn't arrive, it says so, keeps the message, and gives the email address");
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
