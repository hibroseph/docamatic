// Describes what is in chrome.storage.local for error reports, without any of
// the user's data: only types, sizes, counts, a few known setting values and
// the names of storage keys the extension itself uses. Page urls, note text
// and tag names are never included (the privacy policy promises this).
//
// When notes can't be loaded (safe mode), this is the only way to learn what
// the stored data actually looks like, so it is attached to the error report
// the moment it happens. Example:
//   { "pages.type": "string", "pages.length": 48213, "pages.json.type": "object",
//     "pages.json.page_count": 12, "metadata.schema_version": 0, ... }
// It is flat (dotted keys) so Sentry shows every field (it cuts off nested
// objects after a few levels) and the same fields can go to PostHog.
import { LEGACY_STORAGE_KEYS } from "./legacyState";
import { noteIdsIn, typeOf } from "./statePipeline";

// Key names the extension writes itself look like identifiers ("pages",
// "legacyLocalStorageImported"). Anything else is counted rather than named:
// a bug in a 2023 build saved notes under their page url as top level keys.
const isIdentifier = (key) => /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(key);
const looksLikeUrl = (key) => key.includes("://") || /^[^\s]+\.[a-z]{2,}(\/|$)/i.test(key);

// { object: 3, array: 1 }: how many values of each type a collection holds
const typeCounts = (values) =>
  values.reduce((counts, value) => {
    const type = typeOf(value);
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});

const describeTypeCounts = (prefix, values, out) => {
  Object.entries(typeCounts(values)).forEach(([type, count]) => (out[`${prefix}.${type}`] = count));
};

const describeKeys = (prefix, object, out) => {
  const keys = Object.keys(object);
  out[`${prefix}.key_count`] = keys.length;
  const named = keys.filter(isIdentifier).sort();
  if (named.length > 0) out[`${prefix}.keys`] = named.slice(0, 30).join(",");
  const urlLike = keys.filter((key) => !isIdentifier(key) && looksLikeUrl(key)).length;
  if (urlLike > 0) out[`${prefix}.url_key_count`] = urlLike;
  const other = keys.length - named.length - urlLike;
  if (other > 0) out[`${prefix}.other_key_count`] = other;
};

// A url-keyed pages object: { [url]: { notes: [...] } }
const describePagesObject = (prefix, pages, out) => {
  const entries = Object.values(pages);
  out[`${prefix}.page_count`] = entries.length;
  describeTypeCounts(`${prefix}.page_types`, entries, out);

  const withNotes = entries.filter((page) => Array.isArray(page?.notes));
  if (withNotes.length !== entries.length) out[`${prefix}.pages_without_notes_array`] = entries.length - withNotes.length;

  const notes = withNotes.flatMap((page) => page.notes);
  out[`${prefix}.note_count`] = notes.length;
  const withoutId = notes.filter((note) => note?.id === undefined || note?.id === null).length;
  if (withoutId > 0) out[`${prefix}.notes_without_id`] = withoutId;
  // Url keys are counted, never named
  const nonUrlKeys = Object.keys(pages).filter((key) => !looksLikeUrl(key));
  if (nonUrlKeys.length > 0) {
    out[`${prefix}.non_url_key_count`] = nonUrlKeys.length;
    const named = nonUrlKeys.filter(isIdentifier).sort();
    if (named.length > 0) out[`${prefix}.non_url_keys`] = named.slice(0, 30).join(",");
  }
};

/**
 * Describes one stored value. Strings are also parsed as JSON, since older
 * versions saved notes as JSON strings; `asPages` describes an object as a
 * url-keyed pages object.
 */
const describeValue = (prefix, value, out, { asPages = false, parseStrings = true } = {}) => {
  const type = typeOf(value);
  out[`${prefix}.type`] = type;

  if (type === "string") {
    out[`${prefix}.length`] = value.length;
    if (!parseStrings) return;
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      out[`${prefix}.json`] = "invalid";
      return;
    }
    describeValue(`${prefix}.json`, parsed, out, { asPages, parseStrings: false });
  } else if (type === "array") {
    out[`${prefix}.length`] = value.length;
    describeTypeCounts(`${prefix}.item_types`, value, out);
  } else if (type === "object") {
    if (asPages) describePagesObject(prefix, value, out);
    else describeKeys(prefix, value, out);
  } else if (type === "number" || type === "boolean") {
    // Not personal, and the exact value can explain the bug (e.g. pages: 0)
    out[`${prefix}.value`] = value;
  }
};

const describeMetadata = (metadata, out) => {
  describeValue("metadata", metadata, out);
  if (typeOf(metadata) !== "object") return;
  // Known settings only. metadata.user (a random id from 2023 builds) isn't sent.
  const { schema_version, onboarded, analytics_enabled, safe_mode } = metadata;
  out["metadata.schema_version"] = schema_version === undefined ? "missing" : schema_version;
  if (onboarded !== undefined) out["metadata.onboarded"] = onboarded;
  if (analytics_enabled !== undefined) out["metadata.analytics_enabled"] = analytics_enabled;
  if (safe_mode !== undefined) out["metadata.has_safe_mode"] = true;
};

/**
 * @param storage everything in chrome.storage.local
 * @returns a flat object of plain values. Never throws: describing the data
 *   must not get in the way of reporting the error it is attached to.
 */
export const describeStorage = (storage) => {
  const out = {};
  try {
    if (typeOf(storage) !== "object") {
      out["storage.type"] = typeOf(storage);
      return out;
    }

    describeKeys("storage", storage, out);

    if ("pages" in storage) describeValue("pages", storage.pages, out, { asPages: true });
    else out["pages.type"] = "missing";
    if ("tags" in storage) describeValue("tags", storage.tags, out);
    else out["tags.type"] = "missing";
    if ("metadata" in storage) describeMetadata(storage.metadata, out);
    else out["metadata.type"] = "missing";

    LEGACY_STORAGE_KEYS.filter((key) => key in storage).forEach((key) =>
      describeValue(`legacy.${key}`, storage[key], out, { asPages: true })
    );

    // How many notes exist anywhere, in any format: tells whether there is
    // anything to rescue at all
    const notesData = {};
    ["pages", ...LEGACY_STORAGE_KEYS].forEach((key) => key in storage && (notesData[key] = storage[key]));
    out["notes_found_anywhere"] = new Set(noteIdsIn(notesData)).size;

    if ("legacyLocalStorageImported" in storage) out["legacy_import_done"] = storage.legacyLocalStorageImported === true;
    if (Array.isArray(storage.backups)) out["backup_count"] = storage.backups.length;
  } catch (err) {
    out["describe_error"] = String(err?.message || err);
  }
  return out;
};

/** Describes notes saved in an older format (e.g. the MV2 localStorage JSON) */
export const describeNotesValue = (value) => {
  const out = { read: true };
  try {
    describeValue("old_notes", value, out, { asPages: true });
  } catch (err) {
    out["describe_error"] = String(err?.message || err);
  }
  return out;
};

/**
 * Approximate size in characters of each notes key, for spotting quota
 * problems and truncated data
 */
export const storageSizes = (storage) => {
  const out = {};
  ["pages", "tags", "metadata", ...LEGACY_STORAGE_KEYS, "backups"].forEach((key) => {
    if (!(key in (storage || {}))) return;
    try {
      out[`${key}.json_chars`] = JSON.stringify(storage[key])?.length ?? 0;
    } catch {
      out[`${key}.json_chars`] = "unserializable";
    }
  });
  return out;
};
