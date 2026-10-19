// Converts notes saved by older versions of the extension into the current
// state shape. Formats seen over the years:
//
// 1. MV2 (until Sept 2022): JSON string in the background page's localStorage
//    under "notes-chrome-extension://<id>/_generated_background_page.html".
//    A service worker can't read localStorage; see apps/offscreen.
// 2. Early MV3 (Oct-Nov 2022): the same JSON string in chrome.storage.local,
//    under "notes" (or "notesStorageKey", from a bug in one build).
// 3. Current (Nov 2022+): { pages, tags, metadata } as storage.local keys.
//
// Formats 1 and 2 are objects keyed by page url: { [url]: { notes: [...] } }.
import { GetInitialState } from "../utils/GetInitialState";
import { getContrastingColor } from "../utils/ContrastingColor";
import { COLORS, INITIAL_NOTE_WIDTH } from "../utils/constants";

// The notes state is saved as these top level keys in storage.local. Other
// keys (e.g. "analytics") belong to other features and stay out of redux.
export const STATE_KEYS = ["pages", "tags", "metadata"];

// Storage keys early MV3 builds saved the JSON string under
export const LEGACY_STORAGE_KEYS = ["notes", "notesStorageKey"];

const toColor = (color, contrastColor) => {
  if (color && typeof color === "object" && color.title) return color;

  // Before Oct 2019 the color was a plain hex string
  const title = typeof color === "string" ? color : COLORS[0];
  try {
    return { title, text: contrastColor || getContrastingColor(title) };
  } catch {
    return { title: COLORS[0], text: getContrastingColor(COLORS[0]) };
  }
};

// Fills in anything very old notes might be missing, so rendering them can't
// throw (e.g. reading size.width of undefined)
export const normalizeNote = (note) => ({
  ...note,
  position: note.position || { x: 0, y: 0 },
  size: note.size?.width ? note.size : { width: INITIAL_NOTE_WIDTH },
  color: toColor(note.color, note.contrastColor),
});

// Accepts a url-keyed legacy object (or its JSON string) and returns `pages`
export const pagesFromLegacy = (legacy) => {
  const parsed = typeof legacy === "string" ? JSON.parse(legacy) : legacy;
  const pages = {};

  Object.entries(parsed || {}).forEach(([url, page]) => {
    const notes = Array.isArray(page?.notes) ? page.notes.filter((note) => note?.id).map(normalizeNote) : [];
    if (notes.length > 0) {
      pages[url] = { notes };
    }
  });

  return pages;
};

/**
 * Brings whatever is in storage.local up to the current state shape. Loading
 * format 2 as-is is what caused "Cannot read properties of undefined
 * (reading 'https://...')".
 */
export const normalizeState = (storage, onError = () => {}) => {
  if (storage.pages) {
    return {
      pages: storage.pages,
      tags: Array.isArray(storage.tags) ? storage.tags : [],
      metadata: storage.metadata || { onboarded: true },
    };
  }

  let pages = {};
  const legacyKey = LEGACY_STORAGE_KEYS.find((key) => typeof storage[key] === "string");
  if (legacyKey) {
    try {
      pages = pagesFromLegacy(storage[legacyKey]);
    } catch (err) {
      onError(err);
    }
  }

  return {
    ...GetInitialState(),
    pages,
    // Anyone with old data already knows how the extension works
    metadata: { onboarded: true },
  };
};

/**
 * Picks the MV2 notes out of the extension's localStorage contents. Only the
 * background page's copy is used; it was the source of truth.
 * @param {Record<string, string>} entries localStorage key/values
 */
export const findLegacyLocalStorageNotes = (entries) => {
  const key = Object.keys(entries).find(
    (k) => k.startsWith("notes-chrome-extension://") && k.endsWith("/_generated_background_page.html")
  );
  return key ? entries[key] : null;
};
