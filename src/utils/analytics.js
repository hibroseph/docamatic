// Minimal, anonymous usage analytics sent to PostHog from the background
// service worker.
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
  NUKE_NOTES,
  REMOVE_NOTE,
  TRACK,
  USER_ONBOARDED,
} from "../redux/actions";
import { generateUUID } from "./GenerateUUID";

const STORAGE_KEY = "analytics";

const isConfigured = () => Boolean(config.posthog_api_key && config.posthog_host);

// Users can turn analytics off in the popup settings. The setting lives in
// the notes state (metadata), which the background also saves to storage.
const isEnabled = async () => {
  const { metadata } = await chrome.storage.local.get("metadata");
  return metadata?.analytics_enabled !== false;
};

// A random id per install, so PostHog can count unique users without knowing
// anything about who they are
const getAnalyticsState = async () => {
  const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  if (stored?.installId) return stored;

  const created = { installId: generateUUID() };
  await chrome.storage.local.set({ [STORAGE_KEY]: created });
  return created;
};

export const track = async (event, properties = {}) => {
  try {
    if (!isConfigured() || !(await isEnabled())) return;

    const { installId } = await getAnalyticsState();

    await fetch(`${config.posthog_host}/i/v0/e/`, {
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
          environment: config.environment,
          // Anonymous event: no person profile is created for the install id
          $process_person_profile: false,
        },
      }),
    });
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
      return { event: "note_created" };
    case REMOVE_NOTE:
      return { event: "note_deleted" };
    case ADD_TAG:
      return { event: "tag_added" };
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

  const analytics = await getAnalyticsState();
  if (analytics.lastDailyActive === today()) return;

  await chrome.storage.local.set({ [STORAGE_KEY]: { ...analytics, lastDailyActive: today() } });

  const pages = Object.values(state.pages || {}).filter((page) => page.notes?.length > 0);
  const notes = pages.flatMap((page) => page.notes);

  await track("daily_active", {
    note_count: notes.length,
    page_count: pages.length,
    tag_count: state.tags?.length || 0,
    favorite_count: notes.filter((note) => note.heart).length,
  });
};
