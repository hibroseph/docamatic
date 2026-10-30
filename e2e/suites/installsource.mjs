// Installing with the website and a tagged store listing open: what does extension_installed say?
// PostHog's host and the two websites resolve to a local HTTPS stand-in; nothing leaves the machine.
import https from "node:https";
import { readFileSync, mkdtempSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, FIXTURES, backgroundReady, launchChrome } from "../env.mjs";
import { TLS } from "../tls.mjs";
// Another extension, so Chrome's allow-list has something besides Docamatic
// at launch (Docamatic itself is installed later, after the tabs are open)
const DUMMY = `${FIXTURES}/other-extension`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const events = [];
const server = https.createServer({ key: TLS.key, cert: TLS.cert }, (req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    console.log("SERVER", req.method, req.headers.host, req.url, body.slice(0, 120));
    if (req.headers.host?.includes("posthog")) { try { events.push(JSON.parse(body)); } catch {} res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); return res.end("{}"); }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<title>${req.headers.host}</title><p>${req.headers.host}${req.url}</p>`);
  });
});
await new Promise((r) => server.listen(8443, r));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };
const run = async (urls) => {
  events.length = 0;
  // Allowed at launch but not there yet, so Chrome can't install it before the tabs are open
  const LATE = join(mkdtempSync(join(tmpdir(), "late-")), "ext").split("\\").join("/");
  const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "is-")),
    args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT},${DUMMY}`, `--load-extension=${DUMMY}`, "--ignore-certificate-errors", "--host-resolver-rules=MAP us.i.posthog.com 127.0.0.1:8443, MAP hibroseph.github.io 127.0.0.1:8443, MAP chromewebstore.google.com 127.0.0.1:8443, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1", "--ignore-certificate-errors"] });
  try {
    for (const url of urls) { const p = await browser.newPage(); await p.goto(url).catch(() => {}); }
    // Chrome installed it at launch, before the tabs were open: uninstall it,
    // then install it fresh now that they are
    const first = await browser.installExtension(EXT); await backgroundReady(browser);
    await sleep(1500);
    const ext = await browser.newPage();
    await ext.goto(`chrome-extension://${first}/options.html`);
    await ext.evaluate(() => chrome.management.uninstallSelf()).catch(() => {});
    await sleep(1500);
    events.length = 0;
    await browser.installExtension(EXT); await backgroundReady(browser);
    await sleep(3000);
    console.log("ALL", JSON.stringify(events.map((e) => [e.event, e.properties.came_from_website, e.properties.store_tab_open, e.properties.store_utm_medium])));
    return events.find((e) => e.event === "extension_installed")?.properties;
  } finally { await browser.close(); }
};
const SCENARIOS = {
  website: ["https://hibroseph.github.io/docamatic/index.html", "https://chromewebstore.google.com/detail/docamatic-add-sticky-notes-to/mbpkbeacgamdiajpgbblpcgpkidaobob?utm_source=docamatic_website&utm_medium=hero"],
  store: ["https://chromewebstore.google.com/detail/mbpkbeacgamdiajpgbblpcgpkidaobob", "https://example.org/"],
};
try {
  const website = await run(SCENARIOS.website);
  check(website?.came_from_website === true && website.store_utm_source === "docamatic_website" && website.store_utm_medium === "hero", `installed with the website and its store link open (${JSON.stringify(website)})`);
  const store = await run(SCENARIOS.store);
  check(store?.came_from_website === false && store.store_tab_open === true && store.store_utm_source === undefined, `installed from the store alone (${JSON.stringify(store)})`);
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { server.close(); }
