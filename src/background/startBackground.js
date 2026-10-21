import notesApp from "../redux/reducer";
import { createWrapStore } from "webext-redux";
import deepDiff from "webext-redux/lib/strategies/deepDiff/diff";
import { applyMiddleware, createStore } from "redux";
import config from "../../config.json";
import { GetInitialState } from "../utils/GetInitialState";
import { authorizeSender } from "../redux/authorizeSender";
import { importNotes, replaceState, NUKE_NOTES, TRACK } from "../redux/actions";
import { createNoteInTab } from "./createNote";
import { findNote } from "./findNote";
import { noteUrlsFor } from "../utils/noteUrl";
import { CHROME_MESSAGES, CREATE_NOTE_COMMAND, NOTES_UI_FILE } from "../utils/constants";
import { STATE_KEYS, pagesFromLegacy } from "../redux/legacyState";
import { initSentry, captureException, captureMessage, reportReducerErrors } from "../utils/sentry";
import { hostnameOf, isExpectedScriptingError, messageWithoutUrls } from "../utils/expectedFailures";
import { noteShownEvent } from "../redux/noteShown";
import { migrateState } from "../redux/migrations";
import {
  assertNoNotesLost,
  countNotes,
  isEmptyStorage,
  prepareStoredState,
  validateState,
} from "../redux/statePipeline";
import { BACKUPS_STORAGE_KEY, BACKUP_REASONS, addBackup, createBackupEntry } from "../redux/backups";
import { pageHasNotes, urlsThatGainedNotes } from "../redux/pageNotes";
import { setInternalInstall, track, trackActions, trackDailyActive, useStoreForAnalyticsSetting } from "../utils/analytics";

export function startBackground() {
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
  const mountNotesUi = async (sender) => {
    const store = await storeReady;
    // Decided from the url Chrome reports for the sender, not anything in the
    // message, so a page can't probe whether other urls have notes
    if (!pageHasNotes(store.getState(), noteUrlsFor(sender.url))) return false;

    await injectNotesUi(sender.tab.id, sender.frameId);
    return true;
  };

  // The notes UI guards against being injected twice, so this is safe to repeat
  function injectNotesUi(tabId, frameId = 0) {
    return chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      files: [NOTES_UI_FILE],
    });
  }

  // Failing to show notes on a page is only a bug when Chrome didn't have a good
  // reason (closed or unloaded tab, page that can't be scripted). Report the rest.
  const reportShowNotesFailure = (error, pageUrl, stage) => {
    if (isExpectedScriptingError(error)) return;
    captureMessage("Couldn't show notes on a page", {
      stage,
      page_host: hostnameOf(pageUrl),
      error: messageWithoutUrls(error),
    });
  };

  // Loads the notes UI into every open tab showing one of these pages
  const showNotesInOpenTabs = async (urls) => {
    const tabs = await chrome.tabs.query({});
    const matching = tabs.filter((tab) => noteUrlsFor(tab.url).some((key) => urls.includes(key)));
    // Fails for tabs Chrome has unloaded to save memory; they load the UI
    // themselves when they're reopened
    await Promise.all(
      matching.map((tab) => injectNotesUi(tab.id).catch((err) => reportShowNotesFailure(err, tab.url, "new_note_open_tabs")))
    );
  };

  // The page reports when a note it was just asked to show is visible (the
  // last step of the note-creation funnel). The background checks the report
  // against its own data and builds the analytics event itself, so a web page
  // can't invent events or properties (see redux/noteShown.js).
  const reportedShownNotes = new Set();

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== CHROME_MESSAGES.NOTE_SHOWN) return;
    if (sender.id !== chrome.runtime.id || !sender.tab) return;

    storeReady.then((store) => {
      const properties = noteShownEvent({
        state: store.getState(),
        noteId: message.noteId,
        senderUrl: sender.url,
        now: Date.now(),
        alreadyReported: reportedShownNotes,
      });
      if (!properties) return;
      reportedShownNotes.add(message.noteId);
      track("note_shown", properties);
    });
  });

  // Single page apps (GitHub, X, YouTube, ...) change the url with
  // history.pushState instead of loading a new page. Chrome reports every url
  // change here, including those, which is more reliable than detecting it
  // inside the page (where e.g. GitHub only updates the url after fetching the
  // next page). Listened to at the top level so it works when the worker wakes.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (!changeInfo.url) return;
    handleUrlChange(tabId, changeInfo.url).catch((err) => captureException(err, { during: "handling url change" }));
  });

  const handleUrlChange = async (tabId, url) => {
    // A notes UI already on the page switches to the new page's notes. Fails
    // harmlessly when there isn't one (or the page is still loading).
    chrome.tabs.sendMessage(tabId, { action: CHROME_MESSAGES.URL_CHANGED }).catch(() => {});

    // Pages that only have the small loader get the UI if the new url has notes
    const store = await storeReady;
    if (pageHasNotes(store.getState(), noteUrlsFor(url))) {
      await injectNotesUi(tabId).catch((err) => reportShowNotesFailure(err, url, "url_change"));
    }
  };

  // When a page gets its first note (created, imported or restored), show the
  // notes UI in every tab that has that page open. Otherwise those tabs, which
  // only have the small loader, wouldn't show the note until they reload.
  const showNotesWhenPagesGainNotes = (store) => (next) => (action) => {
    const before = store.getState();
    const result = next(action);
    const urls = urlsThatGainedNotes(before, store.getState());
    if (urls.length > 0) {
      showNotesInOpenTabs(urls).catch((err) => captureException(err, { during: "showing notes in open tabs" }));
    }
    return result;
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== CHROME_MESSAGES.MOUNT_NOTES_UI) return;
    // Only our own content scripts, and only into the tab they are running in
    if (sender.id !== chrome.runtime.id || !sender.tab) return;

    mountNotesUi(sender).then(
      (mounted) => sendResponse({ mounted }),
      (err) => {
        reportShowNotesFailure(err, sender.url, "page_request");
        sendResponse({ mounted: false });
      }
    );
    return true; // responding asynchronously
  });

  initSentry("background");

  // For the developer's own Web Store install: run docamaticMarkInternal() in
  // the service worker's DevTools console so its analytics events are marked
  // internal and filtered out of the numbers (unpacked installs always are).
  // docamaticMarkInternal(false) undoes it.
  self.docamaticMarkInternal = async (internal = true) => {
    await setInternalInstall(internal);
    return internal ? "This install's events are now marked internal." : "This install's events are no longer marked internal.";
  };

  // For checking that error reporting works: run docamaticSentryTest() in the
  // service worker's DevTools console. Throwing an error directly in the console
  // doesn't test anything: Chrome doesn't pass console errors to error
  // handlers, and only errors from the extension's own code are reported. This
  // throws an uncaught error from the extension's code, like a real bug would.
  self.docamaticSentryTest = () => {
    setTimeout(() => {
      throw new Error("Docamatic Sentry test (uncaught error in the background)");
    });
    return "Thrown. Look for 'Docamatic Sentry test' in Sentry.";
  };
  chrome.runtime.setUninstallURL(feedbackUrl);

  // Wait this long after the last change before writing to storage. Typing in
  // a note dispatches on every keystroke, and each write serializes every note
  // on every page. The worker stays alive for 30s after the last event, so a
  // pending write can't be lost to the worker shutting down.
  const SAVE_DELAY_MS = 500;

  // --- Keeping notes safe -----------------------------------------------------
  //
  // The rule: stored notes are never changed unless the change is known to be
  // good. Before converting or migrating stored data, an untouched copy is
  // saved as an automatic backup; the new data is written and read back to
  // confirm every note survived; only then are old keys removed. If any of that
  // fails, or the data can't be understood, the extension runs in safe mode:
  // read-only, nothing is written, and the Backup & restore page explains what
  // to do. A failure must never lead to starting with empty notes and saving
  // that over the user's data.

  // Set when stored notes couldn't be loaded safely: { reason, message }
  let safeMode = null;

  const enterSafeMode = (err) => {
    safeMode = { reason: err?.reason || "load_failed", message: err?.message || String(err) };
    console.error("Docamatic is in safe mode; notes will not be changed", err);
    captureException(err, { during: "loading notes", safe_mode_reason: safeMode.reason });
    track("safe_mode_entered", { reason: safeMode.reason });
  };

  // What the store shows in safe mode: no notes (they couldn't be read safely)
  // and a flag the popup uses to show the safe mode message. Never saved.
  const safeModeState = () => {
    const initial = GetInitialState();
    return { ...initial, metadata: { ...initial.metadata, safe_mode: safeMode } };
  };

  // Saves an automatic backup of the notes data currently in storage
  const backupStoredNotes = async (storage, reason) => {
    const entry = createBackupEntry(storage, { reason, extensionVersion: config.version });
    const { [BACKUPS_STORAGE_KEY]: backups } = await chrome.storage.local.get(BACKUPS_STORAGE_KEY);
    await chrome.storage.local.set({ [BACKUPS_STORAGE_KEY]: addBackup(backups, entry) });
  };

  // Writes state, then reads it back to confirm it was saved intact
  const saveAndVerify = async (state) => {
    await chrome.storage.local.set(state);
    const saved = await chrome.storage.local.get(STATE_KEYS);
    validateState(saved);
    assertNoNotesLost(state, saved);
  };

  // Throws (and changes nothing) if the stored notes can't be loaded safely
  const loadState = async () => {
    const storage = await chrome.storage.local.get(null);

    if (isEmptyStorage(storage)) {
      return GetInitialState();
    }

    // Converts older layouts and runs migrations in memory, checking that
    // every note is still there. Throws instead of returning partial data.
    const { state, changed, legacyKeys } = prepareStoredState(storage);

    if (changed) {
      // 1. Keep an untouched copy of the data as it was
      await backupStoredNotes(storage, BACKUP_REASONS.BEFORE_UPDATE);
      // 2. Save the converted data and confirm it saved correctly
      await saveAndVerify(state);
      // 3. Only now remove the old layout's keys
      if (legacyKeys.length > 0) {
        await chrome.storage.local.remove(legacyKeys);
      }
    }

    return state;
  };

  // One automatic backup per day, so a bug that damages notes later can be
  // undone from the Backup & restore page
  const backupDaily = async () => {
    const { [BACKUPS_STORAGE_KEY]: backups } = await chrome.storage.local.get(BACKUPS_STORAGE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    const doneToday = (backups || []).some(
      (backup) => backup.reason === BACKUP_REASONS.DAILY && backup.created_at.startsWith(today)
    );
    if (doneToday) return;
    await backupStoredNotes(await chrome.storage.local.get(null), BACKUP_REASONS.DAILY);
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
    if (safeMode) return;
    // Only Chrome had the 2019-2022 version, and only Chrome has offscreen documents
    if (!chrome.offscreen) return;
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
      // Save right away and confirm it, so the notes are safely in
      // chrome.storage before the import is marked as done (the old copy in
      // localStorage is never deleted either way)
      await saveAndVerify(store.getState());
      track("legacy_notes_imported", { note_count: noteCount, page_count: Object.keys(pages).length });
    }

    await chrome.storage.local.set({ [LEGACY_IMPORT_DONE_KEY]: true });
  };

  // Restores an automatic backup, replacing the current notes. The current
  // notes are backed up first, so a restore can itself be undone.
  const restoreBackup = async (store, backupId) => {
    const { [BACKUPS_STORAGE_KEY]: backups } = await chrome.storage.local.get(BACKUPS_STORAGE_KEY);
    const backup = (backups || []).find((entry) => entry.id === backupId);
    if (!backup) throw new Error("That backup no longer exists.");

    const { state } = prepareStoredState(backup.storage);
    await backupStoredNotes(await chrome.storage.local.get(null), BACKUP_REASONS.BEFORE_RESTORE);
    store.dispatch(replaceState(state));
    await saveAndVerify(store.getState());
    track("backup_restored", { note_count: countNotes(state) });
    return { noteCount: countNotes(state) };
  };

  // Merges notes from a backup file into the current notes (only adds)
  const importBackup = async (store, importedState) => {
    // Checked again here rather than trusting what the page parsed
    const { state } = prepareStoredState(importedState || {});
    await backupStoredNotes(await chrome.storage.local.get(null), BACKUP_REASONS.BEFORE_IMPORT);
    const before = countNotes(store.getState());
    store.dispatch(importNotes(state.pages, state.tags));
    await saveAndVerify(store.getState());
    const added = countNotes(store.getState()) - before;
    track("backup_imported", { note_count: countNotes(state), added_count: added });
    return { noteCount: countNotes(state), addedCount: added };
  };

  // Messages from the Backup & restore page (extension pages only)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handlers = {
      [CHROME_MESSAGES.GET_BACKUP_STATUS]: async () => ({ safeMode }),
      [CHROME_MESSAGES.IMPORT_BACKUP]: async (store) => importBackup(store, message.state),
      [CHROME_MESSAGES.RESTORE_BACKUP]: async (store) => restoreBackup(store, message.backupId),
    };
    const handler = handlers[message?.type];
    if (!handler) return;
    if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(""))) return;

    storeReady
      .then((store) => {
        if (safeMode && message.type !== CHROME_MESSAGES.GET_BACKUP_STATUS) {
          throw new Error("Docamatic is in safe mode, so it won't change your notes. Download a backup and contact us.");
        }
        return handler(store);
      })
      .then(
        (result) => sendResponse({ ok: true, ...result }),
        (err) => {
          captureException(err, { during: message.type });
          sendResponse({ ok: false, error: err?.message || String(err) });
        }
      );
    return true; // responding asynchronously
  });

  // Adding a note (from the popup, the side panel or the keyboard shortcut).
  // Done here rather than in the popup so all three share one path, and so it
  // finishes even though the popup closes as soon as the page gets focus.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== CHROME_MESSAGES.CREATE_NOTE) return;
    if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(""))) return;

    storeReady
      .then(async (store) => {
        if (safeMode) return { ok: false, reason: "safe_mode" };
        const tab = message.tabId ? await chrome.tabs.get(message.tabId) : undefined;
        return createNoteInTab(store, tab, { placement: message.placement, source: message.source });
      })
      .then(sendResponse, (err) => {
        captureException(err, { during: "creating a note" });
        sendResponse({ ok: false, reason: "error" });
      });
    return true; // responding asynchronously
  });

  // "Find on page" from the popup or side panel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== CHROME_MESSAGES.FIND_NOTE) return;
    if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(""))) return;

    storeReady
      .then((store) => findNote(store, message.pageUrl, message.noteId))
      .then(sendResponse, (err) => {
        captureException(err, { during: "finding a note" });
        sendResponse({ ok: false });
      });
    return true; // responding asynchronously
  });

  // The "Add a note to this page" shortcut (Alt+Shift+N by default)
  chrome.commands?.onCommand.addListener((command, tab) => {
    if (command !== CREATE_NOTE_COMMAND) return;
    storeReady
      .then(async (store) => {
        if (safeMode) return;
        const [active] = tab?.id ? [tab] : await chrome.tabs.query({ active: true, currentWindow: true });
        await createNoteInTab(store, active, { placement: "page", source: "shortcut" });
      })
      .catch((err) => captureException(err, { during: "creating a note from the shortcut" }));
  });

  // In safe mode nothing may change the notes (the store holds a placeholder,
  // not the real notes). Analytics events are still allowed through.
  const blockChangesInSafeMode = () => (next) => (action) => {
    if (safeMode && action.type !== TRACK) return;
    return next(action);
  };

  // Deleting every note is the one destructive thing users can do, so keep a
  // backup first. If the backup can't be saved, the delete doesn't happen.
  const backupBeforeDeleteAll = () => (next) => (action) => {
    if (action.type !== NUKE_NOTES) return next(action);
    return chrome.storage.local
      .get(null)
      .then((storage) => backupStoredNotes(storage, BACKUP_REASONS.BEFORE_DELETE_ALL))
      .then(() => next(action));
  };

  loadState()
    .catch((err) => {
      enterSafeMode(err);
      return safeModeState();
    })
    .then((preloadedState) => {
      const store = createStore(
        notesApp,
        preloadedState,
        applyMiddleware(
          authorizeSender,
          blockChangesInSafeMode,
          backupBeforeDeleteAll,
          reportReducerErrors,
          showNotesWhenPagesGainNotes,
          trackActions
        )
      );

      let lastSavedState = preloadedState;
      let saveTimer = null;

      store.subscribe(() => {
        // Never write in safe mode: storage still holds the user's real notes
        if (safeMode) return;

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

      if (safeMode) return;

      // Read the analytics opt-out from the live state from now on (not in safe
      // mode, where the store only holds a placeholder)
      useStoreForAnalyticsSetting(store.getState);

      importLegacyLocalStorage(store)
        .then(() => backupDaily())
        .catch((err) => captureException(err, { during: "startup backups" }))
        .finally(() => trackDailyActive(store.getState()));
    });
}
