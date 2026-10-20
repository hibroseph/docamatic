// Deciding whether a page's "this note is now shown" report should be counted
// as the note_shown step of the note-creation funnel. The page only reports
// the fact; the background checks it against its own data and builds the
// analytics event itself, so a web page can't invent events or properties.
import { notesOnPage } from "./pageNotes";
import { sameSite } from "./authorizeSender";

// Only notes created this recently count as "just created, now shown".
// Older notes being shown is just someone revisiting a page.
export const NEW_NOTE_WINDOW_MS = 2 * 60 * 1000;

/**
 * Returns the note_shown event properties to send, or null to ignore the
 * report.
 * @param alreadyReported Set of note ids already counted
 */
export const noteShownEvent = ({ state, noteId, senderUrl, now, alreadyReported }) => {
  if (!noteId || alreadyReported.has(noteId)) return null;

  // Find the note anywhere (it can be saved under any url on the site)
  const found = notesOnPage(state, Object.keys(state?.pages || {})).find(({ note }) => note.id === noteId);
  if (!found) return null;

  // The same rule as edits: a page can only report notes of its own site
  if (!sameSite(senderUrl, found.pageUrl)) return null;

  const createdAt = Number(found.note.date_created);
  if (!createdAt || now - createdAt > NEW_NOTE_WINDOW_MS) return null;

  return { note_id: noteId, ms_since_created: now - createdAt };
};
