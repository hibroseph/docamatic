// Which pages have notes. Used by the background to load the notes UI into
// open tabs when a page gets its first note.

/** Urls of the pages that have at least one note */
export const pagesWithNotes = (state) =>
  Object.entries(state?.pages || {})
    .filter(([, page]) => page?.notes?.length > 0)
    .map(([url]) => url);

/** Urls that had no notes in `before` and have some in `after` */
export const urlsThatGainedNotes = (before, after) => {
  const had = new Set(pagesWithNotes(before));
  return pagesWithNotes(after).filter((url) => !had.has(url));
};
