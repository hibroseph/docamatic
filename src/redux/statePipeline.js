// Turns whatever is in chrome.storage.local into state the extension can use,
// and refuses (fails closed) rather than risk losing notes.
//
// Everything here is a pure function of its input so it can be tested
// without Chrome. The background (apps/background/background.js) does the
// actual reading/writing, backups and safe mode.
import { LEGACY_STORAGE_KEYS, STATE_KEYS, normalizeState } from "./legacyState";
import { CURRENT_SCHEMA_VERSION, migrateState, schemaVersionOf } from "./migrations";

export class StateError extends Error {
  /**
   * @param {"newer_version" | "invalid_state" | "notes_missing" | "migration_failed"} reason
   */
  constructor(reason, message) {
    super(message);
    this.name = "StateError";
    this.reason = reason;
  }
}

/**
 * Every note id anywhere in saved data, whatever its format (including the
 * JSON strings older versions saved). Used to prove nothing was lost.
 */
export const noteIdsIn = (value) => {
  if (typeof value === "string") {
    try {
      return noteIdsIn(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) =>
    key === "notes" && Array.isArray(child) && child.every((note) => note && typeof note === "object")
      ? child.map((note) => note.id).filter((id) => id !== undefined && id !== null)
      : noteIdsIn(child)
  );
};

export const countNotes = (state) =>
  Object.values(state?.pages || {}).reduce((count, page) => count + (page?.notes?.length || 0), 0);

/** typeof, but telling null and arrays apart from objects */
export const typeOf = (value) => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value);

/**
 * Throws a StateError if state isn't in the shape the extension renders.
 * Messages say what was found instead, since they become the error report's
 * title. They never include page urls: a bad page is identified by position.
 */
export const validateState = (state) => {
  const fail = (message) => {
    throw new StateError("invalid_state", message);
  };
  if (typeOf(state) !== "object") fail(`State is not an object (found ${typeOf(state)})`);
  if (typeOf(state.pages) !== "object") fail(`pages is not an object (found ${typeOf(state.pages)})`);
  Object.values(state.pages).forEach((page, index) => {
    if (!Array.isArray(page?.notes)) {
      fail(`Page ${index + 1} of ${Object.keys(state.pages).length} has no notes array (found ${typeOf(page?.notes)})`);
    }
    if (page.notes.some((note) => note?.id === undefined || note?.id === null)) {
      fail(`A note on page ${index + 1} of ${Object.keys(state.pages).length} has no id`);
    }
  });
  if (!Array.isArray(state.tags)) fail(`tags is not an array (found ${typeOf(state.tags)})`);
  if (typeOf(state.metadata) !== "object") fail(`metadata is not an object (found ${typeOf(state.metadata)})`);
};

/** Throws a StateError unless every note id in `before` is still in `after` */
export const assertNoNotesLost = (before, after) => {
  const remaining = new Set(noteIdsIn(after));
  const lost = [...new Set(noteIdsIn(before))].filter((id) => !remaining.has(id));
  if (lost.length > 0) {
    throw new StateError("notes_missing", `${lost.length} note(s) would be lost`);
  }
};

/**
 * Prepares stored data for use.
 *
 * Returns { state, changed, legacyKeys }:
 *   state      - validated state at the current schema version
 *   changed    - true if it differs from what's stored and must be saved
 *   legacyKeys - old storage keys to remove, *after* the new state is saved
 *
 * Throws a StateError, without touching anything, when the data is from a
 * newer version of the extension, can't be converted, or would lose notes.
 *
 * @param storage everything in chrome.storage.local
 * @param migrate injectable for tests
 */
export const prepareStoredState = (storage, { migrate = migrateState } = {}) => {
  const raw = {};
  [...STATE_KEYS, ...LEGACY_STORAGE_KEYS].forEach((key) => {
    if (key in storage) raw[key] = storage[key];
  });

  if (schemaVersionOf(raw) > CURRENT_SCHEMA_VERSION) {
    throw new StateError(
      "newer_version",
      `Saved notes use schema version ${schemaVersionOf(raw)}, this version understands up to ${CURRENT_SCHEMA_VERSION}`
    );
  }

  let state;
  try {
    const normalized = normalizeState(raw, (err) => {
      throw err;
    });
    state = migrate(normalized);
  } catch (err) {
    if (err instanceof StateError) throw err;
    throw new StateError("migration_failed", err?.message || String(err));
  }

  validateState(state);
  assertNoNotesLost(raw, state);

  const legacyKeys = LEGACY_STORAGE_KEYS.filter((key) => key in storage);
  const changed = legacyKeys.length > 0 || !raw.pages || schemaVersionOf(raw) !== schemaVersionOf(state);

  return { state, changed, legacyKeys };
};

/** True when storage holds no notes data at all (a fresh install) */
export const isEmptyStorage = (storage) =>
  ![...STATE_KEYS, ...LEGACY_STORAGE_KEYS].some((key) => key in storage);
