import { CHROME_MESSAGES } from "../utils/constants";
import { NEW_NOTE_WINDOW_MS } from "../redux/noteShown";
import type { NoteRecord } from "../model/types";

// Notes already reported as shown on this page
const reportedShown = new Set<string>();

// Tells the background when a note that was just created becomes visible:
// the last step of the note-creation funnel (see redux/noteShown.js). Only
// recently created notes are reported; others are just a page being revisited.
// The homepage demo renders the same notes on a normal website, where there's
// no extension to tell, so it does nothing there.
export const reportNewlyShownNotes = (notes: NoteRecord[]) => {
  if (!(globalThis as { chrome?: typeof chrome }).chrome?.runtime?.id) return;
  const now = Date.now();
  notes.forEach(({ note }) => {
    if (reportedShown.has(note.id) || !(now - Number(note.date_created) <= NEW_NOTE_WINDOW_MS)) return;
    reportedShown.add(note.id);
    chrome.runtime.sendMessage({ type: CHROME_MESSAGES.NOTE_SHOWN, noteId: note.id }).catch(() => {});
  });
};
