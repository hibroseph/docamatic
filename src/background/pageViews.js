// What a web page's notes UI gets to see of the notes: only that page's.
//
// The notes UI runs inside the web page (as a content script), the least
// trusted part of the extension: a page that compromises its renderer can
// read whatever the content script holds. So it's sent only the notes of the
// page it's on, the tags (names and colors, for the tag editor; each tag's
// list of notes cut down to this page's), and the note settings. Never the
// notes of other sites. (Docamatic's own pages, the popup and so on, get
// the whole state through extensionPagesBridge.js.)
import { pageKeysFor, pageShows } from "../utils/noteUrl";

/** The part of the state the page at `href` may see */
export const pageViewFor = (state, href) => {
  const pages = {};
  // Its own keys and the patterns covering it (notes shown on many pages)
  for (const key of pageKeysFor(href, state?.pages)) {
    const page = state?.pages?.[key];
    if (page) pages[key] = page;
  }
  const noteIds = new Set(Object.values(pages).flatMap((page) => (page.notes || []).map((note) => note.id)));
  const tags = (Array.isArray(state?.tags) ? state.tags : []).map((tag) => ({
    ...tag,
    notes: (tag.notes || []).filter((id) => noteIds.has(id)),
  }));
  const metadata = state?.metadata || {};
  return {
    pages,
    tags,
    metadata: {
      preferences: metadata.preferences,
      safe_mode: metadata.safe_mode,
      hints: metadata.hints,
    },
  };
};

/**
 * Which pages' views a change affects: the page keys whose notes changed, or
 * every page when something they all show changed (tags, settings).
 */
export const changedPages = (previous, next) => {
  if (previous === next) return { all: false, keys: new Set() };
  if (
    previous?.tags !== next?.tags ||
    previous?.metadata?.preferences !== next?.metadata?.preferences ||
    previous?.metadata?.safe_mode !== next?.metadata?.safe_mode ||
    previous?.metadata?.hints !== next?.metadata?.hints
  ) {
    return { all: true, keys: new Set() };
  }
  const keys = new Set();
  const before = previous?.pages || {};
  const after = next?.pages || {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[key] !== after[key]) keys.add(key);
  }
  return { all: false, keys };
};

/** Whether the page at `href` shows any of these page keys */
export const showsAnyOf = (href, keys) => [...keys].some((key) => pageShows(href, key));
