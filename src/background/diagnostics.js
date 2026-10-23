// The diagnostic report people can download from Settings and send along
// when something isn't working: the state of the extension, with nothing
// personal in it. No note text, titles, tag names or page addresses (see
// model/diagnostics.ts for the notes part). It includes the install's random
// id, the same one error reports and usage statistics carry, so a report can
// be matched with what Sentry and PostHog already have.
import config from "../../config.json";
import { describeStorage, storageSizes } from "../redux/storageShape";
import { lifecycleContext, LIFECYCLE_STORAGE_KEY } from "../utils/lifecycle";
import { BACKUPS_STORAGE_KEY } from "../redux/backups";
import { RECENT_ERRORS_KEY } from "../utils/sentry";
import { analyticsAllowed, browserName, getInstallId, isInternalInstall } from "../utils/analytics";
import { messageWithoutUrls } from "../utils/expectedFailures";
import { knownPreferences, noteStats } from "../model/diagnostics";
import { SURVEYS_STORAGE_KEY } from "../model/surveys";
import { CREATE_NOTE_COMMAND } from "../utils/constants";
import { joinPages } from "../redux/storedLayout";

export const DIAGNOSTICS_FORMAT = "docamatic-diagnostics";
const DIAGNOSTICS_VERSION = 1;

const safely = async (read, fallback = "unavailable") => {
  try {
    return await read();
  } catch (err) {
    return `${fallback}: ${messageWithoutUrls(err)}`;
  }
};

/**
 * @param state the background store's state
 * @param safeMode { reason, message } when the notes couldn't be loaded
 * @param loadStep how far loading the notes got
 */
export const buildDiagnosticReport = async ({ state, safeMode, loadStep }) => {
  // The notes joined into { pages } whatever the layout (redux/storedLayout.js)
  const storage = await safely(async () => joinPages(await chrome.storage.local.get(null)), {});
  const storageObject = storage && typeof storage === "object" ? storage : {};
  // In safe mode the store only holds a placeholder: describe what's saved
  const source = safeMode || !state ? storageObject : state;
  const metadata = (source.metadata && typeof source.metadata === "object" ? source.metadata : null) || {};

  return {
    format: DIAGNOSTICS_FORMAT,
    version: DIAGNOSTICS_VERSION,
    created_at: new Date().toISOString(),
    about:
      "Docamatic's state, for finding a problem. It has no note text, titles, tag names or page addresses.",

    extension: {
      version: config.version,
      environment: config.environment,
      install_id: await safely(() => getInstallId()),
      internal: await safely(() => isInternalInstall()),
      install_type: await safely(async () => (await chrome.management?.getSelf?.())?.installType ?? "unknown"),
      history: lifecycleContext(storageObject[LIFECYCLE_STORAGE_KEY]),
    },

    browser: {
      name: browserName(),
      user_agent: navigator.userAgent,
      language: navigator.language,
    },

    state: {
      safe_mode: safeMode ? { reason: safeMode.reason, message: messageWithoutUrls({ message: safeMode.message }) } : null,
      load_step: loadStep,
      schema_version: metadata.schema_version ?? "missing",
      onboarded: metadata.onboarded,
      usage_statistics: await safely(() => analyticsAllowed()),
      preferences: knownPreferences(metadata.preferences),
    },

    notes: noteStats(source),

    storage: {
      shape: describeStorage(storageObject),
      sizes: storageSizes(storageObject),
      bytes_in_use: await safely(() =>
        chrome.storage.local.getBytesInUse ? chrome.storage.local.getBytesInUse(null) : Promise.resolve("not available in this browser")
      ),
      keys: Object.keys(storageObject).sort(),
    },

    backups: (Array.isArray(storageObject[BACKUPS_STORAGE_KEY]) ? storageObject[BACKUPS_STORAGE_KEY] : []).map((backup) => ({
      created_at: backup.created_at,
      reason: backup.reason,
      extension_version: backup.extension_version,
      note_count: backup.note_count,
      readable: backup.readable,
    })),

    permissions: {
      all_websites: await safely(() => chrome.permissions.contains({ origins: ["<all_urls>"] })),
      granted: await safely(async () => (await chrome.permissions.getAll()).permissions),
      files: await safely(() =>
        chrome.extension?.isAllowedFileSchemeAccess ? chrome.extension.isAllowedFileSchemeAccess() : Promise.resolve("unknown")
      ),
      new_note_shortcut: await safely(async () => (await chrome.commands.getAll()).find((c) => c.name === CREATE_NOTE_COMMAND)?.shortcut || "not set"),
      side_panel: Boolean(chrome.sidePanel),
    },

    surveys: (() => {
      const memory = storageObject[SURVEYS_STORAGE_KEY] || {};
      return {
        days_used: memory.daysUsed?.count || 0,
        answered_or_dismissed: Object.keys(memory.done || {}).length,
      };
    })(),

    recent_errors: Array.isArray(storageObject[RECENT_ERRORS_KEY]) ? storageObject[RECENT_ERRORS_KEY] : [],
  };
};
