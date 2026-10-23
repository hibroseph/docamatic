// How the notes are laid out in chrome.storage.local (since schema version 2).
//
// Each page's notes are stored under a key of their own, "page:<url>",
// instead of everything under one "pages" key. Saving after an edit then
// writes just the page that changed, not every note there is: with years of
// notes, rewriting all of them on every keystroke was slow and the most
// likely write to fail.
//
// Only this module knows about the keys. Everything else (loading and
// migrations, backups, diagnostics, error reports) works with the stored data
// joined back into the familiar { pages, tags, metadata } shape by
// joinPages(). That also keeps page addresses out of anything that describes
// storage by its key names.
//
//   storage.local                         joinPages(storage)
//   "page:https://a.com/": { notes }      pages: { "https://a.com/": { notes },
//   "page:https://b.com/": { notes }               "https://b.com/": { notes } }
//   tags, metadata, backups, ...          tags, metadata, backups, ...

export const PAGE_KEY_PREFIX = "page:";

export const pageKey = (url) => PAGE_KEY_PREFIX + url;
const isPageKey = (key) => key.startsWith(PAGE_KEY_PREFIX);

/** Whether storage holds anything in the per-page layout */
export const hasPageKeys = (storage) => Object.keys(storage || {}).some(isPageKey);

/**
 * The stored data with the per-page keys joined into `pages`, as everything
 * outside this module expects it. Data still in the old layout (a "pages"
 * key) comes through unchanged. If both are there (an interrupted
 * conversion), every page from either is kept, the per-page copy winning.
 */
export const joinPages = (storage) => {
  if (!hasPageKeys(storage)) {
    // Saved in this layout with no notes at all (a fresh start, every note
    // deleted): nothing under any page key, and no "pages" either
    const inThisLayout = (storage?.metadata?.schema_version ?? 0) >= 2;
    return inThisLayout && storage.pages === undefined ? { ...storage, pages: {} } : storage;
  }
  const joined = {};
  const pages = {};
  for (const [key, value] of Object.entries(storage)) {
    if (isPageKey(key)) pages[key.slice(PAGE_KEY_PREFIX.length)] = value;
    else joined[key] = value;
  }
  const old = joined.pages && typeof joined.pages === "object" && !Array.isArray(joined.pages) ? joined.pages : {};
  joined.pages = { ...old, ...pages };
  return joined;
};

/**
 * What to write to save `state` in full: every page under its own key, plus
 * the tags and settings. `remove` lists the keys that must go: the old
 * layout's "pages", and pages that are in storage but no longer in the state.
 */
export const fullWrite = (state, storedKeys = []) => {
  const set = { tags: state.tags, metadata: state.metadata };
  for (const [url, page] of Object.entries(state.pages || {})) set[pageKey(url)] = page;
  const remove = storedKeys.filter((key) => key === "pages" || (isPageKey(key) && !(key in set)));
  return { set, remove };
};

/**
 * What to write to go from the saved state `previous` to `next`: the pages
 * that changed (or are new), the tags and settings if they changed, and the
 * keys of pages that are gone. The reducer never changes state in place, so
 * an unchanged page is the same object. With no `previous` (nothing saved
 * yet), everything.
 */
export const changedWrite = (previous, next) => {
  const set = {};
  const remove = [];
  if (previous?.tags !== next.tags) set.tags = next.tags;
  if (previous?.metadata !== next.metadata) set.metadata = next.metadata;
  const before = previous?.pages || {};
  const after = next.pages || {};
  for (const [url, page] of Object.entries(after)) {
    if (before[url] !== page) set[pageKey(url)] = page;
  }
  for (const url of Object.keys(before)) {
    if (!(url in after)) remove.push(pageKey(url));
  }
  return { set, remove };
};

/** Writes the result of fullWrite / changedWrite: the new data first, then the removals */
export const applyWrite = async (storageArea, { set, remove }) => {
  if (Object.keys(set).length > 0) await storageArea.set(set);
  if (remove.length > 0) await storageArea.remove(remove);
};
