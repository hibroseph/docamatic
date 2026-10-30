// 5.1: surveys written in PostHog, shown in the popup. PostHog is a local stand-in.
import https from "node:https";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHROME, CHROME_FLAGS, EXT, OUT, backgroundReady, extensionWorker, launchChrome } from "../env.mjs";
import { TLS } from "../tls.mjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };

// ---- The stand-in PostHog
let surveys = [];
const requests = [];
const events = [];
const server = https.createServer({ key: TLS.key, cert: TLS.cert }, (req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const url = new URL(req.url, "https://x");
    const json = (data) => { res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); res.end(JSON.stringify(data)); };
    requests.push({ path: url.pathname, body: body ? JSON.parse(body) : null });
    if (url.pathname === "/api/surveys/") return json({ surveys });
    if (url.pathname === "/flags/") {
      const { person_properties: p, flag_keys } = JSON.parse(body);
      // Like PostHog: targeting on note_count >= 3, and the internal flag off once answered/dismissed
      const flags = {};
      for (const key of flag_keys) {
        const id = key.replace(/^survey-targeting-|-internal$/g, "");
        // Surveys whose id starts with "w" are targeted at surface = welcome
        const enabled = key.endsWith("-internal")
          ? !Object.keys(p).some((k) => k.includes(`/${id}`))
          : p.note_count >= 3 && (!id.startsWith("w") || p.surface === "welcome");
        flags[key] = { key, enabled, variant: null };
      }
      return json({ flags });
    }
    if (url.pathname === "/i/v0/e/") { events.push(JSON.parse(body)); return json({ status: 1 }); }
    json({});
  });
}).listen(8443);

const survey = (id, questions, extra = {}) => ({
  id, name: "Survey " + id, type: "api", start_date: "2026-10-01T00:00:00Z", end_date: null, questions,
  targeting_flag_key: `survey-targeting-${id}`, internal_targeting_flag_key: `survey-targeting-${id}-internal`,
  conditions: null, appearance: { displayThankYouMessage: true, thankYouMessageHeader: "Thanks, that helps!" }, ...extra,
});
const THREE = [
  { id: "rate", type: "rating", question: "How useful is Docamatic?", scale: 5, display: "number", lowerBoundLabel: "Not at all", upperBoundLabel: "Very" },
  { id: "use", type: "single_choice", question: "What do you use it for most?", choices: ["Research", "Shopping", "Work", "Something else"], hasOpenChoice: true },
  { id: "why", type: "open", question: "Anything else?", optional: true },
];

const browser = await launchChrome({ executablePath: CHROME, headless: true, pipe: true, userDataDir: mkdtempSync(join(tmpdir(), "sv-")),
  args: [...CHROME_FLAGS, "--enable-unsafe-extension-debugging", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--ignore-certificate-errors",
    "--host-resolver-rules=MAP us.i.posthog.com 127.0.0.1:8443, MAP *.sentry.io 127.0.0.1, MAP sentry.io 127.0.0.1"] });
const id = (await browser.waitForTarget((t) => t.url().startsWith("chrome-extension://"))).url().split("/")[2];
const note = (i) => ({ id: "n" + i, position: { x: 80, y: 100 }, size: { width: 260 }, title: "Secret title " + i, body: "secret body", date_created: 1, color: "yellow", visible: true, tags: [] });
const reset = async ({ notes = 4, analytics = true } = {}) => {
  const sw = await extensionWorker(browser);
  await sw.evaluate(async (d) => {
    const { metadata, analytics } = await chrome.storage.local.get(["metadata", "analytics"]);
    await chrome.storage.local.clear();
    await chrome.storage.local.set({ analytics: { ...analytics, internal: false }, pages: { "https://a.com/": { notes: d.notes } }, tags: [], metadata: { ...metadata, onboarded: true, analytics_enabled: d.analytics } });
  }, { notes: Array.from({ length: notes }, (_, i) => note(i)), analytics });
  await browser.installExtension(EXT); await backgroundReady(browser);
  await sleep(1800);
  requests.length = 0;
  events.length = 0;
};
const openPopup = async () => { const p = await browser.newPage(); await p.setViewport({ width: 380, height: 640 }); await p.goto(`chrome-extension://${id}/popup.html`); await sleep(1800); return p; };
const named = (name) => events.filter((e) => e.event === name);
try {
  await sleep(1500);
  // ---- 1. A three question survey, answered
  surveys = [survey("s1", THREE)];
  await reset();
  let popup = await openPopup();
  check(Boolean(await popup.$('[data-testid="survey"]')), "a survey targeted at 3+ notes shows in the popup");
  const flagsReq = requests.find((r) => r.path === "/flags/");
  console.log("person_properties:", JSON.stringify(flagsReq?.body.person_properties));
  check(flagsReq?.body.person_properties.note_count === 4 && flagsReq.body.person_properties.days_used === 1 && !JSON.stringify(flagsReq.body).includes("ecret"), "PostHog decides on counts only, never note contents");
  check(named("survey shown").length === 1 && named("survey shown")[0].properties.$survey_id === "s1", "survey shown is sent");
  await popup.screenshot({ path: `${OUT}/survey-1.png` });
  await popup.evaluate(() => [...document.querySelectorAll(".survey__point")].find((b) => b.textContent === "4").click());
  await popup.click('[data-testid="survey-next"]');
  await sleep(200);
  await popup.type(".survey__other", "Planning trips");
  await popup.screenshot({ path: `${OUT}/survey-2.png` });
  await popup.click('[data-testid="survey-next"]');
  await sleep(200);
  check(/Anything else/.test(await popup.$eval('[data-testid="survey"]', (e) => e.innerText)), "one question at a time");
  await popup.click('[data-testid="survey-next"]'); // optional: skipped
  await sleep(1200);
  const sent = named("survey sent")[0]?.properties;
  console.log("sent:", JSON.stringify(sent && { rate: sent.$survey_response_rate, use: sent.$survey_response_use, why: sent.$survey_response_why, completed: sent.$survey_completed, questions: sent.$survey_questions?.length }));
  check(sent?.$survey_response_rate === "4" && sent.$survey_response_use === "Planning trips" && !("$survey_response_why" in sent) && sent.$survey_completed === true && sent.$survey_questions.length === 3, "answers are sent the way PostHog's results read them");
  check(/Thanks, that helps!/.test(await popup.$eval('[data-testid="survey"]', (e) => e.innerText)), "with the thank-you set in PostHog");
  await popup.screenshot({ path: `${OUT}/survey-thanks.png` });
  await popup.close();
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')), "never shown again once answered");
  await popup.close();

  // ---- 2. No thanks
  surveys = [survey("s2", [{ id: "q", type: "open", question: "What is missing?" }])];
  await reset();
  popup = await openPopup();
  await popup.click('[data-testid="survey-dismiss"]');
  await sleep(800);
  check(named("survey dismissed").length === 1 && !(await popup.$('[data-testid="survey"]')), "No thanks closes it and sends survey dismissed");
  await popup.close();
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')), "and it doesn't come back");
  await popup.close();

  // ---- 3. Not targeted, statistics off, and surveys Docamatic can't show
  surveys = [survey("s3", [{ id: "q", type: "open", question: "?" }])];
  await reset({ notes: 1 });
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')), "not shown when PostHog's targeting says no (1 note)");
  await popup.close();
  await reset({ analytics: false });
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')) && requests.length === 0, `with usage statistics off, PostHog isn't even asked (${requests.map((r) => r.path)})`);
  await popup.close();
  surveys = [survey("s4", [{ id: "q", type: "open", question: "?" }], { conditions: { url: "example.com" } })];
  await reset();
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')) && !requests.some((r) => r.path === "/flags/"), "a survey for a website's page isn't shown (nor are flags asked)");
  await popup.close();

  // ---- 4. Waiting for an event
  surveys = [survey("s5", [{ id: "q", type: "open", question: "How is the board?" }], { conditions: { events: { values: [{ name: "board_opened" }] } } })];
  await reset();
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')), "a survey waiting for board_opened isn't shown before");
  await popup.close();
  const board = await browser.newPage();
  await board.goto(`chrome-extension://${id}/board.html`);
  await sleep(1500);
  await board.close();
  popup = await openPopup();
  check(Boolean(await popup.$('[data-testid="survey"]')), "and is once the board has been opened");
  await popup.close();
  // ---- 5. On the board, the side panel and the welcome page too
  surveys = [survey("s6", [{ id: "q", type: "open", question: "What would make the board better?" }])];
  await reset();
  const boardPage = await browser.newPage();
  await boardPage.setViewport({ width: 1280, height: 800 });
  await boardPage.goto(`chrome-extension://${id}/board.html`);
  await sleep(2000);
  check(Boolean(await boardPage.$('[data-testid="survey"]')), "a survey shows on the board");
  check(requests.find((r) => r.path === "/flags/")?.body.person_properties.surface === "board", "PostHog is told it's the board (surface = board)");
  await boardPage.screenshot({ path: `${OUT}/survey-board.png` });
  await boardPage.type(".survey__text", "Zoom please");
  await boardPage.click('[data-testid="survey-next"]');
  await sleep(1200);
  check(named("survey sent").at(-1)?.properties.$survey_response_q === "Zoom please", "and can be answered there");
  await boardPage.close();
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')), "answered on the board, it doesn't show in the popup");
  await popup.close();

  surveys = [survey("s7", [{ id: "q", type: "open", question: "Side panel?" }])];
  await reset();
  const panel = await browser.newPage();
  await panel.setViewport({ width: 400, height: 700 });
  await panel.goto(`chrome-extension://${id}/sidepanel.html`);
  await sleep(2000);
  check(Boolean(await panel.$('[data-testid="survey"]')), "a survey shows in the side panel");
  await panel.close();

  surveys = [survey("w1", [{ id: "q", type: "single_choice", question: "How did you hear about Docamatic?", choices: ["A friend", "Search", "The Chrome Web Store", "Somewhere else"], hasOpenChoice: true }])];
  await reset();
  popup = await openPopup();
  check(!(await popup.$('[data-testid="survey"]')), "a survey for surface = welcome doesn't show in the popup");
  await popup.close();
  const welcome = await browser.newPage();
  await welcome.setViewport({ width: 1280, height: 900 });
  await welcome.goto(`chrome-extension://${id}/onboarding.html`);
  await sleep(2000);
  check(Boolean(await welcome.$('[data-testid="survey"]')), "but does on the welcome page");
  await welcome.screenshot({ path: `${OUT}/survey-welcome.png` });
  await welcome.close();
  console.log(fails ? `${fails} FAILED` : "all passed");
} finally { await browser.close(); server.close(); }
