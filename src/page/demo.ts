// A practice version of notes on a page, with a local store: the real note
// components, nothing saved. Used by the website and the welcome page.
// Nothing here may rely on extension APIs, which don't exist on a website.
import { createStore } from "redux";
import notesApp from "../redux/reducer";
import { addNote, addText, addTitle, addTag } from "../redux/actions";
import { generateUUID } from "../utils/GenerateUUID";
import { noteUrlFor } from "../utils/noteUrl";
import { NEW_NOTE_WIDTH, placeNewNote } from "../model/placement";
import { allNotes } from "../model/notes";
import type { NoteColorName } from "../model/colors";
import { mountNotes } from "./mountNotes";

export interface DemoNote {
  x: number;
  y: number;
  title?: string;
  body?: string;
  color?: NoteColorName;
  tags?: string[];
  width?: number;
}

export const startDemo = (seed: DemoNote[] = []) => {
  const store = createStore(notesApp, { pages: {}, tags: [], metadata: {} } as never);
  const pageUrl = noteUrlFor(window.location.href);

  const add = (note: Partial<DemoNote> = {}, { seeded = false } = {}) => {
    const id = generateUUID();
    const position =
      note.x !== undefined && note.y !== undefined
        ? { x: note.x, y: note.y }
        : placeNewNote(
            {
              scrollPosition: document.documentElement.scrollTop,
              scrollLeft: document.documentElement.scrollLeft,
              pageWidth: document.documentElement.clientWidth,
              pageHeight: document.documentElement.clientHeight,
            },
            allNotes(store.getState() as never).map(({ note: n }) => n.position)
          );
    const action = addNote(id, position.y, pageUrl, undefined, {
      position,
      width: note.width || NEW_NOTE_WIDTH,
      color: note.color || "yellow",
    });
    // Seeded notes are already "on the page" when it opens, so they're dated
    // a while ago (only just-created notes get the cursor)
    store.dispatch(seeded ? { ...action, date_created: Date.now() - 60_000 } : action);
    if (note.title) store.dispatch(addTitle(id, note.title, pageUrl));
    if (note.body) store.dispatch(addText(id, note.body, pageUrl));
    note.tags?.forEach((tag) => store.dispatch(addTag(id, pageUrl, tag)));
    return id;
  };

  seed.forEach((note) => add(note, { seeded: true }));

  mountNotes({ store, id: "docamatic-demo", mode: "open", saveTitles: false });
  return { addNote: () => add() };
};
