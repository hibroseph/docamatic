// The built website, served as if it were the published site; PostHog requests are caught, never sent
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { gunzipSync } from "node:zlib";
import { CHROME, SITE_DIST } from "../env.mjs";
const DIST = SITE_DIST;
const SITE = "https://hibroseph.github.io/docamatic/";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, pipe: true });
const events = [];
const otherHosts = new Set();
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860 });
  await page.setUserAgent((await browser.userAgent()).replace("HeadlessChrome", "Chrome"));
  await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  // PostHog's own requests are caught in the page, decompressed, and answered
  // there, so nothing goes out and the events can be read
  await page.exposeFunction("__recordPosthog", (json) => { try { const parsed = JSON.parse(json); (Array.isArray(parsed) ? parsed : parsed.batch || [parsed]).forEach((e) => events.push(e)); } catch { events.push({ event: "(unparsed)" }); } });
  await page.evaluateOnNewDocument(() => {
    const read = async (url, body) => {
      let blob = body instanceof Blob ? body : new Blob([body ?? ""]);
      const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
      if (head[0] === 0x1f && head[1] === 0x8b) blob = await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).blob();
      let text = await blob.text();
      if (/compression=base64/.test(url) || text.startsWith("data=")) text = atob(decodeURIComponent(text.replace(/^data=/, "")));
      window.__recordPosthog(text);
    };
    const realFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      const url = String(input?.url || input);
      if (!url.includes("posthog.com")) return realFetch(input, init);
      await read(url, init.body);
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    };
    navigator.sendBeacon = (url, body) => { if (String(url).includes("posthog.com")) { read(String(url), body); return true; } return false; };
  });
  await page.setRequestInterception(true);
  page.on("console", (m) => console.log("CONSOLE", m.type(), m.text().slice(0, 160)));
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.href.startsWith(SITE)) {
      const file = url.pathname.replace("/docamatic/", "") || "index.html";
      try { return req.respond({ status: 200, contentType: TYPES[extname(file)] || "application/octet-stream", body: readFileSync(join(DIST, file)) }); } catch { return req.respond({ status: 404, body: "" }); }
    }
    if (!url.href.startsWith(SITE)) console.log("REQ", req.method(), url.href.slice(0, 90));
    if (url.hostname.endsWith("posthog.com")) {
      const raw = req.postData() || "";
      let body = raw;
      try { body = gunzipSync(Buffer.from(raw, "binary")).toString(); } catch {}
      try { const parsed = JSON.parse(body); (Array.isArray(parsed) ? parsed : parsed.batch || [parsed]).forEach((e) => events.push(e)); } catch { events.push({ event: "(unparsed " + url.pathname + ")", raw: body.slice(0, 80) }); }
      return req.respond({ status: 200, contentType: "application/json", body: "{}" });
    }
    otherHosts.add(url.hostname);
    return req.respond({ status: 204, body: "" });
  });
  await page.goto(SITE + "index.html", { waitUntil: "load" });
  await sleep(1500);
  await page.click("#try-note");
  await sleep(300);
  await page.mouse.click(1080, 470, { button: "right" });
  await sleep(200);
  await page.keyboard.press("Enter");
  await sleep(300);
  await page.keyboard.type("my secret demo text");
  await page.evaluate(() => document.querySelector(".hero__cta").addEventListener("click", (e) => e.preventDefault()));
  await page.click(".hero__cta");
  await sleep(500);
  // Leaving the page: fired by hand so the in-page catcher is still alive to read it
  await page.evaluate(() => { window.dispatchEvent(new Event("beforeunload")); window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })); });
  await sleep(800);
  await page.goto(SITE + "privacy.html", { waitUntil: "load" });
  await sleep(2500);
  const names = events.map((e) => e.event);
  console.log("events:", names.join(", "));
  check(names.filter((n) => n === "$pageview").length >= 2, "a pageview per page");
  check(names.includes("$pageleave"), "pageleave");
  check(events.filter((e) => e.event === "website_demo_note_added").map((e) => e.properties.method).sort().join() === "button,right_click", "demo notes counted by method");
  check(events.some((e) => e.event === "website_add_to_chrome_clicked" && e.properties.placement === "hero"), "Add to Chrome click with placement");
  check(events.every((e) => e.properties?.surface === "website"), "every event marked surface=website");
  check(!JSON.stringify(events).includes("secret demo"), "nothing typed in the demo is sent");
  const stored = await page.evaluate(() => ({ cookies: document.cookie, local: Object.keys(localStorage).join(), session: Object.keys(sessionStorage).join() }));
  check(!stored.cookies && !/ph_/.test(stored.local + stored.session), `nothing stored on the device ${JSON.stringify(stored)}`);
  check(otherHosts.size === 0, `no other third-party requests ${[...otherHosts].join(", ")}`);
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); }
