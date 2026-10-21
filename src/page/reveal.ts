// "Find on page": the popup or side panel asks a page to show one of its
// notes (scroll to it, bring it to the front, outline it). The notes UI
// passes the request here; the note, if it's on this page, handles it.
// Kept inside the extension's isolated world, like utils/urlChanges.js.
const handlers = new Map<string, () => void>();

/** Called by a note on the page; returns the function that stops listening */
export const onReveal = (noteId: string, handler: () => void) => {
  handlers.set(noteId, handler);
  return () => {
    if (handlers.get(noteId) === handler) handlers.delete(noteId);
  };
};

/** Whether the note is on this page (and was shown) */
export const revealNote = (noteId: string) => {
  const handler = handlers.get(noteId);
  handler?.();
  return Boolean(handler);
};
