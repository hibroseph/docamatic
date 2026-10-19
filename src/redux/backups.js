// Backup files (downloaded by users) and automatic backups (kept in
// chrome.storage.local). Pure functions; the background and the Backup &
// restore page do the storage and file handling.
import { LEGACY_STORAGE_KEYS, STATE_KEYS } from "./legacyState";
import { StateError, countNotes, prepareStoredState } from "./statePipeline";

export const BACKUP_FILE_FORMAT = "docamatic-backup";
export const BACKUP_FILE_VERSION = 1;

// chrome.storage.local key holding the automatic backups
export const BACKUPS_STORAGE_KEY = "backups";
// How many automatic backups to keep for each reason
export const MAX_BACKUPS_PER_REASON = 3;

export const BACKUP_REASONS = {
  BEFORE_UPDATE: "before-update", // before stored data is converted/migrated
  DAILY: "daily",
  BEFORE_RESTORE: "before-restore", // before a backup replaces current notes
  BEFORE_IMPORT: "before-import", // before a file is merged in
  BEFORE_DELETE_ALL: "before-delete-all", // before "Nuke" deletes every note
};

/**
 * The notes-related part of chrome.storage.local, exactly as stored. Backups
 * keep this raw copy so they can be restored even if it is in a format the
 * extension can't currently read.
 */
export const notesDataFrom = (storage) => {
  const data = {};
  [...STATE_KEYS, ...LEGACY_STORAGE_KEYS].forEach((key) => {
    if (key in storage) data[key] = storage[key];
  });
  return data;
};

const describeData = (data) => {
  try {
    return { note_count: countNotes(prepareStoredState(data).state), readable: true };
  } catch {
    return { note_count: null, readable: false };
  }
};

/** Builds the contents of a downloadable backup file */
export const createBackupFile = (storage, { extensionVersion, now = new Date() }) => {
  const data = notesDataFrom(storage);
  return {
    format: BACKUP_FILE_FORMAT,
    format_version: BACKUP_FILE_VERSION,
    exported_at: now.toISOString(),
    extension_version: extensionVersion,
    ...describeData(data),
    storage: data,
  };
};

/**
 * Reads a backup file's text into state that can be imported. Accepts:
 * - backup files from the Backup & restore page
 * - the older Settings export (just the url-keyed `pages` object)
 * - a raw dump of chrome.storage.local
 * Throws an Error with a user-readable message when it can't.
 */
export const parseBackupFile = (text) => {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON, so it can't be a Docamatic backup.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("This file isn't a Docamatic backup.");
  }

  let storage;
  if (parsed.format === BACKUP_FILE_FORMAT) {
    storage = parsed.storage || {};
  } else if ([...STATE_KEYS, ...LEGACY_STORAGE_KEYS].some((key) => key in parsed)) {
    storage = parsed;
  } else if (Object.values(parsed).some((page) => Array.isArray(page?.notes))) {
    // Older Settings export: just the pages
    storage = { pages: parsed, tags: [], metadata: {} };
  } else {
    throw new Error("This file isn't a Docamatic backup.");
  }

  try {
    const { state } = prepareStoredState(storage);
    return { state, noteCount: countNotes(state) };
  } catch (err) {
    if (err instanceof StateError && err.reason === "newer_version") {
      throw new Error("This backup is from a newer version of Docamatic. Update the extension, then try again.");
    }
    throw new Error("This backup couldn't be read: " + err.message);
  }
};

/** Adds an automatic backup, keeping only the newest few for each reason */
export const addBackup = (backups, entry, maxPerReason = MAX_BACKUPS_PER_REASON) => {
  const all = [...(backups || []), entry].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const kept = [];
  const perReason = {};
  for (let i = all.length - 1; i >= 0; i--) {
    const reason = all[i].reason;
    perReason[reason] = (perReason[reason] || 0) + 1;
    if (perReason[reason] <= maxPerReason) kept.unshift(all[i]);
  }
  return kept;
};

/** Builds an automatic backup entry of the given storage contents */
export const createBackupEntry = (storage, { reason, extensionVersion, now = new Date() }) => {
  const data = notesDataFrom(storage);
  return {
    id: `${now.toISOString()}-${reason}`,
    created_at: now.toISOString(),
    reason,
    extension_version: extensionVersion,
    ...describeData(data),
    storage: data,
  };
};
