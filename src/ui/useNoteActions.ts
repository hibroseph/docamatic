// Everything a person can do to one note, as functions. Used by the note on
// the page and the note cards in the popup and side panel, so both always
// behave the same way.
import { useMemo } from "react";
import { useDispatch, useStore } from "react-redux";
import {
  addTag,
  addText,
  addTitle,
  changeNoteColor,
  heartify,
  layoutNote,
  removeNote,
  removeTag,
  restoreNote,
  toggleVisibility,
  updateNotePosition,
  updateNoteSize,
} from "../redux/actions";
import type { NoteAnchor, NoteRecord, State } from "../model/types";
import { tagsOfNote } from "../model/notes";
import { useUndo } from "./undo";

export const useNoteActions = ({ note, pageUrl }: NoteRecord) => {
  // The proxy store's dispatch returns a promise; failures are reported by
  // its middleware (utils/sentry.js trackDispatches)
  const dispatch = useDispatch();
  const store = useStore<State>();
  const offerUndo = useUndo();
  const id = note.id;

  return useMemo(
    () => ({
      setTitle: (title: string) => dispatch(addTitle(id, title, pageUrl)),
      setBody: (body: string) => dispatch(addText(id, body, pageUrl)),
      toggleFavorite: () => dispatch(heartify(id, pageUrl)),
      /** A palette color name, or a hex to go back to a note's original color */
      setColor: (color: string) => dispatch(changeNoteColor(id, pageUrl, color)),
      setVisible: (visible: boolean, { undoable = false } = {}) => {
        dispatch(toggleVisibility(id, pageUrl, visible));
        if (undoable && !visible) {
          offerUndo("Note hidden from the page. It's still in Docamatic.", () =>
            dispatch(toggleVisibility(id, pageUrl, true))
          );
        }
      },
      addTag: (text: string) => dispatch(addTag(id, pageUrl, text)),
      removeTag: (tagId: string) => dispatch(removeTag(id, pageUrl, tagId)),
      /** anchor: what it moves with (page/anchor.ts); null for the page, left out for unchanged */
      move: (x: number, y: number, anchor?: NoteAnchor | null) => dispatch(updateNotePosition(id, x, y, pageUrl, anchor)),
      resize: (width: number) => dispatch(updateNoteSize(id, width, pageUrl)),
      setHeight: (height: number | null) => dispatch(layoutNote(id, pageUrl, { height })),
      setCollapsed: (collapsed: boolean) => dispatch(layoutNote(id, pageUrl, { collapsed })),
      /** position: on screen when pinning, on the page when unpinning */
      setPinned: (pinned: boolean, position: { x: number; y: number }) =>
        dispatch(layoutNote(id, pageUrl, { pinned, position })),
      remove: () => {
        // Keep what's needed to put it back exactly as it was
        const state = store.getState();
        const current = state.pages?.[pageUrl]?.notes?.find((n) => n.id === id) || note;
        const tags = tagsOfNote(state.tags, current).map(({ id: tagId, text, color }) => ({ id: tagId, text, color }));
        dispatch(removeNote(id, pageUrl));
        offerUndo("Note deleted.", () => dispatch(restoreNote(pageUrl, current, tags)));
      },
    }),
    // `note` is only read as a fallback when deleting; the handlers are tied to the id
    [id, pageUrl, dispatch, store, offerUndo]
  );
};

export type NoteActions = ReturnType<typeof useNoteActions>;
