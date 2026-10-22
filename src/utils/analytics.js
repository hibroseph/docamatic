// Minimal usage analytics sent to PostHog from the background service
// worker. Not linked to anyone's identity, but PostHog does store the
// sender's IP address (used for approximate location); the privacy policy
// (src/apps/homepage/privacy.html) says so.
//
// Why not the posthog-js SDK: it expects a web page (window, localStorage),
// so it can't run in an MV3 service worker, and by default it downloads extra
// code at runtime, which Manifest V3 doesn't allow. PostHog's capture endpoint
// is a single HTTP call, so we call it directly.
// https://posthog.com/docs/api/capture
//
// What is sent: event names, counts and the extension version, tied to a
// random id generated on install. Never urls, hostnames, or note contents.
import config from "../../config.json";
import {
  ADD_NOTE,
  ADD_TAG,
  ADD_TEXT,
  ADD_TITLE,
  DELETE_TAG,
  NUKE_NOTES,
  REMOVE_NOTE,
  RESTORE_NOTE,
  UPDATE_TAG,
  TRACK,
  USER_ONBOARDED,
} from "../redux/actions";
import { generateUUID } from "./GenerateUUID";

const STORAGE_KEY = "analytics";

// Which Chromium browser this is (Chrome, Edge, Brave, Opera, ...), from the
// browser's own client hints, for spotting browser-specific problems.
// Brands include generic entries ("Chromium", "Not A(Brand") to skip.
export const browserName = (brands = globalThis.navigator?.userAgentData?.brands, userAgent = globalThis.navigator?.userAgent || "") => {
  const specific = (brands || []).map((b) => b.brand).filter((name) => !/chromium|not.?a.?brand/i.test(name));
  if (specific[0]) return specific[0];
  if (brands?.length) return "Chromium";
  // Firefox has no client hints
  return /\bFirefox\//.test(userAgent) ? "Firefox" : "unknown";
};

const isConfigured = () => Boolean(config.posthog_api_key && config.posthog_host);

// Users can turn analytics off in the popup settings. The setting lives in
// the notes state (metadata). Once the background's store is loaded it is
// read from there, so turning it off takes effect immediately; before that
// (e.g. the install event) it is read from storage.
let readEnabledFromStore = null;

export const useStoreForAnalyticsSetting = (getState) => {
  readEnabledFromStore = () => getState().metadata?.analytics_enabled !== false;
};

const isEnabled = async () => {
  if (readEnabledFromStore) return readEnabledFromStore();
  const { metadata } = await chrome.storage.local.get("metadata");
  return metadata?.analytics_enabled !== false;
};

// A random id per install, so PostHog can count unique users without knowing
// anything about who they are. Several events can be sent at once while the
// service worker starts (e.g. install + daily active), so the id is looked up
// or created once and shared; otherwise each could create its own id and one
// install would count as several users.
let installIdPromise = null;

export const getInstallId = () => {
  if (!installIdPromise) {
    installIdPromise = (async () => {
      const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
      if (stored?.installId) return stored.installId;
      const installId = generateUUID();
      await chrome.storage.local.set({ [STORAGE_KEY]: { ...stored, installId } });
      return installId;
    })().catch((err) => {
      installIdPromise = null; // try again next time
      throw err;
    });
  }
  return installIdPromise;
};

// For tests
export const resetAnalyticsForTests = () => {
  installIdPromise = null;
  internalPromise = null;
  readEnabledFromStore = null;
};

// Marks the developer's own installs so PostHog can filter them out of the
// numbers ("Filter out internal and test users": internal != true). Event
// properties are used because events have no person profiles, so PostHog
// cohorts can't be used for this.
// - Unpacked installs ("Load unpacked") are always internal.
// - Any other install can be marked by hand: run docamaticMarkInternal() in
//   the service worker's DevTools console (see background.js).
let internalPromise = null;

export const isInternalInstall = () => {
  if (!internalPromise) {
    internalPromise = (async () => {
      const self = await chrome.management?.getSelf?.().catch(() => null);
      if (self?.installType === "development") return true;
      const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
      return stored?.internal === true;
    })().catch(() => false);
  }
  return internalPromise;
};

export const setInternalInstall = async (internal) => {
  await getInstallId(); // make sure the stored entry exists
  const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  await chrome.storage.local.set({ [STORAGE_KEY]: { ...stored, internal } });
  internalPromise = null;
};

// One event to PostHog's capture endpoint; resolves with the response
const send = async (event, properties) => {
  const installId = await getInstallId();
  const internal = await isInternalInstall();
  return fetch(`${config.posthog_host}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.posthog_api_key,
      event,
      distinct_id: installId,
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        extension_version: config.version,
        browser: browserName(),
        internal,
        environment: config.environment,
        // No PostHog person profile is created for the install id
        $process_person_profile: false,
      },
    }),
  });
};

/**
 * Feedback someone wrote and chose to send (the popup's "Tell us", or
 * Settings). Unlike usage events it's sent even with usage statistics off:
 * the person pressed Send. It's the only event with text they wrote in it;
 * the privacy policy says so. Resolves true when PostHog accepted it.
 */
export const sendFeedback = async (properties) => {
  if (!isConfigured()) return false;
  try {
    const response = await send("feedback_submitted", properties);
    return response.ok;
  } catch {
    return false;
  }
};

// Told about each event that's sent (surveys can wait for one; see
// background/surveys.js)
let eventListener = null;
export const onEventTracked = (listener) => {
  eventListener = listener;
};

/** Whether usage statistics can be sent: set up, and not turned off in Settings */
export const analyticsAllowed = async () => isConfigured() && (await isEnabled());

export const track = async (event, properties = {}) => {
  try {
    if (!isConfigured() || !(await isEnabled())) return;
    eventListener?.(event);
    await send(event, properties);
  } catch (err) {
    // Analytics must never break the extension (offline, blocked by an ad
    // blocker, ...)
    console.debug("Analytics event not sent", err);
  }
};

// Typing dispatches on every keystroke; only count the first edit of each
// note per service worker session
const editedNotes = new Set();

/**
 * Which analytics event (if any) an action represents. Kept separate from the
 * middleware so it can be unit tested.
 */
export const eventForAction = (action) => {
  switch (action.type) {
    case ADD_NOTE:
      // The note id (random, not personal) links this to note_shown
      return { event: "note_created", properties: { note_id: action.id } };
    case REMOVE_NOTE:
      return { event: "note_deleted" };
    case RESTORE_NOTE:
      return { event: "note_restored" };
    case ADD_TAG:
      return { event: "tag_added" };
    case UPDATE_TAG:
      return { event: "tag_edited" };
    case DELETE_TAG:
      return { event: "tag_deleted" };
    case NUKE_NOTES:
      return { event: "all_notes_deleted" };
    case USER_ONBOARDED:
      return { event: "onboarding_viewed" };
    case ADD_TEXT:
    case ADD_TITLE:
      if (editedNotes.has(action.id)) return null;
      editedNotes.add(action.id);
      return { event: "note_edited" };
    case TRACK:
      // Sent by the popup for things that aren't state changes (e.g. opening it)
      return { event: action.event, properties: action.properties };
    default:
      return null;
  }
};

// Redux middleware for the background store: turns actions into events
export const trackActions = () => (next) => (action) => {
  const result = next(action);
  const tracked = eventForAction(action);
  if (tracked) track(tracked.event, tracked.properties);
  return result;
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Sends one "daily_active" event per install per day, with a few counts that
 * show how much the extension is actually being used. The service worker
 * starts whenever the browser loads a page, so this runs on any day the
 * browser is used, even if nobody opens the popup.
 */
export const trackDailyActive = async (state) => {
  if (!isConfigured()) return;

  // Make sure the shared install id exists before reading the stored entry
  await getInstallId();
  const analytics = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  if (analytics.lastDailyActive === today()) return;

  await chrome.storage.local.set({ [STORAGE_KEY]: { ...analytics, lastDailyActive: today() } });

  await track("daily_active", usageCounts(state));
};

/** How much someone has: counts only, never what's in the notes */
export const usageCounts = (state) => {
  const pages = Object.values(state?.pages || {}).filter((page) => page.notes?.length > 0);
  const notes = pages.flatMap((page) => page.notes);
  return {
    note_count: notes.length,
    page_count: pages.length,
    tag_count: state?.tags?.length || 0,
    favorite_count: notes.filter((note) => note.heart).length,
  };
};
