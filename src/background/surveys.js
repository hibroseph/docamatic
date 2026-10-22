// Surveys from PostHog, for the popup (model/surveys.ts says which and when).
//
// Fetches the survey definitions (data, never code) and asks PostHog's
// feature flags which of them this install is targeted by, sending counts
// such as how many notes there are (personProperties). Only while usage
// statistics are on: a survey's answers are usage data too. Docs:
// docs/surveys.md.
import config from "../../config.json";
import { analyticsAllowed, browserName, getInstallId, isInternalInstall, track, usageCounts } from "../utils/analytics";
import { generateUUID } from "../utils/GenerateUUID";
import {
  SURVEYS_STORAGE_KEY,
  cleanAnswers,
  cleanSurvey,
  flagKeysFor,
  personProperties,
  surveyEventProperties,
  surveyKey,
  surveySentProperties,
  surveyToShow,
  surveysToShow,
  withDayUsed,
  withDone,
  withEvent,
  withShown,
} from "../model/surveys";

// The definitions change rarely; fetched again after this long
const DEFINITIONS_KEY = "surveyDefinitions";
const DEFINITIONS_TTL_MS = 3 * 60 * 60 * 1000;
// At most this many definitions are kept
const MAX_DEFINITIONS = 50;

const readMemory = async () => (await chrome.storage.local.get(SURVEYS_STORAGE_KEY))[SURVEYS_STORAGE_KEY] || {};

// Changes to what's remembered, one at a time, so two at once (an event
// while a survey is answered) can't overwrite each other
let updates = Promise.resolve();
const updateMemory = (change) => {
  const run = updates.then(async () => {
    const memory = await readMemory();
    const next = change(memory);
    if (next !== memory) await chrome.storage.local.set({ [SURVEYS_STORAGE_KEY]: next });
    return next;
  });
  updates = run.catch(() => {});
  return run;
};
const today = () => new Date().toISOString().slice(0, 10);

/** The surveys Docamatic can show, from the cache or PostHog */
const definitions = async () => {
  const cached = (await chrome.storage.local.get(DEFINITIONS_KEY))[DEFINITIONS_KEY];
  let raw = cached?.surveys || [];
  if (!cached || Date.now() - cached.at > DEFINITIONS_TTL_MS) {
    try {
      const response = await fetch(`${config.posthog_host}/api/surveys/?token=${encodeURIComponent(config.posthog_api_key)}`);
      if (response.ok) {
        const json = await response.json();
        raw = Array.isArray(json?.surveys) ? json.surveys.slice(0, MAX_DEFINITIONS) : [];
        await chrome.storage.local.set({ [DEFINITIONS_KEY]: { at: Date.now(), surveys: raw } });
      }
    } catch {
      // Offline or blocked: keep what was cached
    }
  }
  // Checked every time: a cached survey may have ended since
  return raw.map((survey) => cleanSurvey(survey)).filter(Boolean);
};

/** PostHog's answer for these flags, given the install's counts; null if it couldn't be asked */
const evaluateFlags = async (keys, properties) => {
  try {
    const response = await fetch(`${config.posthog_host}/flags/?v=2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: config.posthog_api_key,
        distinct_id: await getInstallId(),
        person_properties: properties,
        flag_keys: keys,
      }),
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.flags && typeof json.flags === "object" ? json.flags : null;
  } catch {
    return null;
  }
};

/**
 * The survey the popup should show, if any. Also counts today as a day
 * Docamatic was used (the `days_used` surveys can target).
 */
export const surveyForPopup = async (state, surface) => {
  const memory = await updateMemory((m) => withDayUsed(m, today()));
  if (!(await analyticsAllowed())) return null;

  const surveys = await definitions();
  // First what's possible here (not answered, triggered, ...), then PostHog's targeting
  const candidates = surveysToShow(surveys, null, memory);
  if (candidates.length === 0) return null;
  const keys = flagKeysFor(candidates);
  const flags = keys.length
    ? await evaluateFlags(keys, personProperties(usageCounts(state), memory, {
          extension_version: config.version,
          browser: browserName(),
          surface,
          // The developer's own installs: target internal = true to try a survey first
          internal: await isInternalInstall(),
        }))
    : {};
  if (!flags) return null;
  return surveyToShow(candidates, flags, memory);
};

/**
 * Shown, dismissed or answered, from the popup: checked against the survey,
 * remembered here, and sent to PostHog as its survey events.
 */
export const recordSurvey = async ({ kind, surveyId, answers }) => {
  const survey = (await definitions()).find(({ id }) => id === surveyId);
  if (!survey) return { ok: false };

  if (kind === "shown") {
    let firstToday = false;
    await updateMemory((memory) => {
      firstToday = !(memory.shown?.[surveyKey(survey)] || []).includes(today());
      return withShown(memory, survey);
    });
    if (firstToday) track("survey shown", surveyEventProperties(survey));
  } else if (kind === "dismissed") {
    await updateMemory((memory) => withDone(memory, survey, "dismissed"));
    track("survey dismissed", surveyEventProperties(survey));
  } else if (kind === "sent") {
    const clean = cleanAnswers(survey, answers || {});
    if (!clean) return { ok: false };
    await updateMemory((memory) => withDone(memory, survey, "sent"));
    track("survey sent", surveySentProperties(survey, clean, generateUUID()));
  } else {
    return { ok: false };
  }
  return { ok: true };
};

// Event names that have happened on this install, for surveys that wait for
// one. Each is written once.
const seenEvents = new Set();
export const rememberEvent = async (name) => {
  if (seenEvents.has(name) || name.startsWith("survey ")) return;
  seenEvents.add(name);
  await updateMemory((memory) => withEvent(memory, name));
};
