import notesApp from "../../redux/reducer";
import { createWrapStore } from "webext-redux";
import deepDiff from "webext-redux/lib/strategies/deepDiff/diff";
import { applyMiddleware, createStore } from "redux";
import config from "../../../config.json";
import { GetInitialState } from "../../utils/GetInitialState";
import { authorizeSender } from "../../redux/authorizeSender";
import { importNotes } from "../../redux/actions";
import { GetSafeNoteUrl } from "../../utils/GetSafeNoteUrl";
import { CHROME_MESSAGES, NOTES_UI_FILE } from "../../utils/constants";
import { LEGACY_STORAGE_KEYS, STATE_KEYS, normalizeState, pagesFromLegacy } from "../../redux/legacyState";
import { initSentry, captureException, captureMessage, reportReducerErrors } from "../../utils/sentry";
import { migrateState, schemaVersionOf } from "../../redux/migrations";
import { track, trackActions, trackDailyActive } from "../../utils/analytics";

// This runs as a Manifest V3 service worker. Chrome will shut it down when it
// is idle and start it again when an event comes in, so this file runs from
// the top on every wake-up. Any state held only in memory is lost between
// wake-ups; chrome.storage.local is the source of truth.

console.debug(`Starting up Docamatic Background ${config.environment}:${config.release_prefix}:${config.version}`);
let feedbackUrl = "https://forms.gle/Wn3GFbDQwq4YqzFs9";

// MV3 requires event listeners to be registered synchronously on startup,
// otherwise the event that woke the worker can be missed. createWrapStore
// registers the messaging listeners now and queues any incoming dispatches
// until wrapStore() is called once the state has been loaded from storage.
const wrapStore = createWrapStore({ channelName: "NOTES_STORE" });

chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  // Only show onboarding on a fresh install, not on every worker restart
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: "/onboarding.html" });
    track("extension_installed");
  } else if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
    track("extension_updated", { previous_version: previousVersion });
  }
});

// Resolves with the redux store once the state has been loaded from storage
let resolveStoreReady;
const storeReady = new Promise((resolve) => (resolveStoreReady = resolve));

// The loader content script (apps/script/loader.js) asks for the notes UI to
// be injected into its tab. Injecting from here rather than having the page
// load it means the UI bundle doesn't need to be web accessible, so websites
// can't use it to detect the extension.
const mountNotesUi = async ({ onlyIfPageHasNotes }, sender) => {
  if (onlyIfPageHasNotes) {
    const store = await storeReady;
    // Decided from the url Chrome reports for the sender, not anything in the
    // message, so a page can't probe whether other urls have notes
    const notes = store.getState().pages?.[GetSafeNoteUrl(sender.url)]?.notes;
    if (!notes?.length) return false;
  }

  await chrome.scripting.executeScript({
    target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
    files: [NOTES_UI_FILE],
  });
  return true;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== CHROME_MESSAGES.MOUNT_NOTES_UI) return;
  // Only our own content scripts, and only into the tab they are running in
  if (sender.id !== chrome.runtime.id || !sender.tab) return;

  mountNotesUi(message, sender).then(
    (mounted) => sendResponse({ mounted }),
    (err) => {
      captureException(err, { during: "mounting notes UI" });
      sendResponse({ mounted: false });
    }
  );
  return true; // responding asynchronously
});

initSentry("background");
chrome.runtime.setUninstallURL(feedbackUrl);

// Wait this long after the last change before writing to storage. Typing in
// a note dispatches on every keystroke, and each write serializes every note
// on every page. The worker stays alive for 30s after the last event, so a
// pending write can't be lost to the worker shutting down.
const SAVE_DELAY_MS = 500;

const loadState = async () => {
  const storage = await chrome.storage.local.get(null);

  if (!STATE_KEYS.some((key) => key in storage) && !LEGACY_STORAGE_KEYS.some((key) => key in storage)) {
    return GetInitialState();
  }

  // Older, unversioned layouts are converted to the version 0 shape first,
  // then the numbered migrations bring it up to the current version
  const normalized = normalizeState(storage, (err) => captureException(err, { during: "legacy storage migration" }));
  const state = migrateState(normalized, {
    onNewerVersion: (version) =>
      captureMessage("Saved notes are from a newer version of the extension", { schema_version: version }),
  });

  if (!storage.pages) {
    // Replace the early MV3 layout (storage.local.set() only adds keys)
    await chrome.storage.local.remove(LEGACY_STORAGE_KEYS);
  }

  // Save migrated data right away, rather than whenever the next edit happens
  if (!storage.pages || schemaVersionOf(state) !== schemaVersionOf(storage)) {
    await chrome.storage.local.set(state);
  }

  return state;
};

const LEGACY_IMPORT_DONE_KEY = "legacyLocalStorageImported";
const OFFSCREEN_URL = "offscreen.html";

// Opens the offscreen document and waits for it to send the MV2 notes
// (a JSON string, or null if there are none). The offscreen API needs
// Chrome 109+, which is why manifest.json sets minimum_chrome_version.
const readLegacyLocalStorage = async () => {
  const fromOffscreen = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      reject(new Error("Timed out reading legacy localStorage"));
    }, 10000);

    const listener = (message, sender) => {
      if (message?.type !== "DOCAMATIC_LEGACY_LOCAL_STORAGE") return;
      if (sender.url !== chrome.runtime.getURL(OFFSCREEN_URL)) return;
      clearTimeout(timeout);
      chrome.runtime.onMessage.removeListener(listener);
      resolve(message.notes);
    };
    chrome.runtime.onMessage.addListener(listener);
  });

  // Only one offscreen document may exist; one could be left over from a
  // worker that was shut down mid-migration
  await chrome.offscreen.closeDocument().catch(() => {});
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
    justification: "Move notes saved by an older version of the extension into chrome.storage",
  });

  try {
    return await fromOffscreen;
  } finally {
    await chrome.offscreen.closeDocument().catch(() => {});
  }
};

/**
 * One time import of notes from the Manifest V2 version (format 1 in
 * redux/legacyState.js). Runs once per install; IMPORT_NOTES only adds notes
 * that don't already exist, so running it again could never duplicate notes.
 * The old localStorage copy is left in place as a backup.
 */
const importLegacyLocalStorage = async (store) => {
  const { [LEGACY_IMPORT_DONE_KEY]: done } = await chrome.storage.local.get(LEGACY_IMPORT_DONE_KEY);
  if (done) return;

  let pages = {};
  try {
    const legacyNotes = await readLegacyLocalStorage();
    // pagesFromLegacy produces version 0 notes; run them through the
    // migrations so they match the current format before merging them in
    const legacyPages = legacyNotes ? pagesFromLegacy(legacyNotes) : {};
    pages = migrateState({ pages: legacyPages, tags: [], metadata: { schema_version: 0 } }).pages;
  } catch (err) {
    // Not marked as done, so it is retried the next time the worker starts
    captureException(err, { during: "legacy localStorage import" });
    return;
  }

  const noteCount = Object.values(pages).reduce((count, page) => count + page.notes.length, 0);

  if (noteCount > 0) {
    store.dispatch(importNotes(pages));
    // Save right away rather than waiting for the debounced save, so the
    // notes are in chrome.storage before the import is marked as done
    await chrome.storage.local.set(store.getState());
    track("legacy_notes_imported", { note_count: noteCount, page_count: Object.keys(pages).length });
  }

  await chrome.storage.local.set({ [LEGACY_IMPORT_DONE_KEY]: true });
};

loadState()
  .catch((err) => {
    console.error("Failed to read notes from storage, starting with initial state", err);
    captureException(err, { during: "loading state" });
    return GetInitialState();
  })
  .then((preloadedState) => {
    const store = createStore(notesApp, preloadedState, applyMiddleware(authorizeSender, reportReducerErrors, trackActions));

    let lastSavedState = preloadedState;
    let saveTimer = null;

    store.subscribe(() => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const state = store.getState();
        // Actions that didn't change anything return the same object
        if (state === lastSavedState) return;

        chrome.storage.local.set(state).then(
          () => (lastSavedState = state),
          (err) => captureException(err, { during: "saving state" })
        );
      }, SAVE_DELAY_MS);
    });

    // Every open tab receives every state change. With the default shallow
    // diff a single keystroke re-sends the whole `pages` object (every note on
    // every site) to every tab; deepDiff sends only what actually changed.
    wrapStore(store, { diffStrategy: deepDiff });
    resolveStoreReady(store);

    importLegacyLocalStorage(store).finally(() => trackDailyActive(store.getState()));
  });
