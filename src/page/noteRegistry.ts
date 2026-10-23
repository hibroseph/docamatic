// What the popup and side panel can ask of a note on the page: point it out
// ("Find on page"), move it to where the person is looking ("Bring here"),
// and say where it is (on screen, further down, ...). Each note on the page
// registers itself here; the notes UI answers the messages from it.
// Kept inside the extension's isolated world, like utils/urlChanges.js.

/** Where a note is compared with what's on screen */
export type NotePlace =
  | "visible"
  /** Further down the page (on pages that load more as you scroll, maybe not loaded that far yet) */
  | "below"
  | "above"
  /** Off to the side, e.g. after the window got narrower */
  | "aside"
  /** In a scrolling panel, scrolled out of view */
  | "away";

export interface NoteControls {
  reveal: () => void;
  bringHere: () => void;
  place: () => NotePlace;
}

const notes = new Map<string, NoteControls>();

/** Called by a note on the page; returns the function that stops listening */
export const registerNote = (noteId: string, controls: NoteControls) => {
  notes.set(noteId, controls);
  return () => {
    if (notes.get(noteId) === controls) notes.delete(noteId);
  };
};

/** Whether the note is on this page (and was shown) */
export const revealNote = (noteId: string) => {
  const note = notes.get(noteId);
  note?.reveal();
  return Boolean(note);
};

export const bringNoteHere = (noteId: string) => {
  const note = notes.get(noteId);
  note?.bringHere();
  return Boolean(note);
};

/** Where every note on this page is, by id */
export const notePlaces = () => Object.fromEntries([...notes].map(([id, note]) => [id, note.place()]));
