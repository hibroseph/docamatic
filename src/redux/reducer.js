import { COLORS as colorList, INITIAL_NOTE_WIDTH } from "../utils/constants";
import { getContrastingColor } from "../utils/ContrastingColor";
import {
  ADD_NOTE,
  ADD_TAG,
  ADD_TEXT,
  ADD_TITLE,
  CHANGE_COLOR,
  HEARTIFY,
  IMPORT_NOTES,
  MOVE_NOTE,
  NUKE_NOTES,
  REMOVE_NOTE,
  REMOVE_TAG,
  RESIZE_NOTE,
  SET_ANALYTICS_ENABLED,
  TOGGLE_VISIBILITY,
  USER_ONBOARDED,
} from "./actions";
import { generateUUID } from "../utils/GenerateUUID";
import { getRandomTagColor } from "../utils/RandomTagColor";
import { GetInitialState } from "../utils/GetInitialState";

/*
 * State shape:
 * {
 *   pages: { [url]: { notes: Note[] } },
 *   tags: [{ id, text, color, notes: noteId[] }],
 *   metadata: { onboarded, analytics_enabled }
 * }
 */

// Applies `update` to the notes of a single page. If the page doesn't exist
// (e.g. the note was already deleted from another tab, or the url changed
// under a single page app) the state is returned unchanged instead of
// throwing "Cannot read properties of undefined".
const updatePageNotes = (state, url, update) => {
  const page = state.pages?.[url];
  if (!page) return state;

  return {
    ...state,
    pages: {
      ...state.pages,
      [url]: { ...page, notes: update(page.notes || []) },
    },
  };
};

// Merges the result of `update(note)` into the note with the given id
const updateNote = (state, url, id, update) =>
  updatePageNotes(state, url, (notes) => notes.map((note) => (note.id === id ? { ...note, ...update(note) } : note)));

const createNote = (action) => {
  const color = colorList[Math.floor(Math.random() * colorList.length)];

  return {
    id: action.id,
    // Random horizontal position so new notes don't stack exactly on top of each other
    position: { x: Math.floor(Math.random() * (600 + 1)), y: action.y_position },
    size: { width: INITIAL_NOTE_WIDTH },
    body: action.highlightedText || null,
    title: null,
    date_created: action.date_created,
    color: { title: color, text: getContrastingColor(color) },
    stickify: false,
    heart: false,
    visible: true,
  };
};

const notesApp = (state = GetInitialState(), action) => {
  switch (action.type) {
    case ADD_TAG: {
      const tags = state.tags || [];
      const existingTag = tags.find((tag) => tag.text == action.text);

      if (existingTag?.notes?.includes(action.noteId)) {
        return state;
      }

      const tagId = existingTag ? existingTag.id : generateUUID();

      const newState = updateNote(state, action.url, action.noteId, (note) => ({
        tags: [...(note.tags || []).filter((tag) => tag.id != tagId), { id: tagId }],
      }));

      if (newState === state) {
        return state;
      }

      return {
        ...newState,
        tags: existingTag
          ? tags.map((tag) => (tag.id === tagId ? { ...tag, notes: [...(tag.notes || []), action.noteId] } : tag))
          : [...tags, { id: tagId, color: getRandomTagColor(), text: action.text, notes: [action.noteId] }],
      };
    }

    case REMOVE_TAG: {
      // Remove the tag from the note, and the note from the tag. Tags that are
      // no longer on any note are deleted.
      const newState = updateNote(state, action.url, action.noteId, (note) => ({
        tags: (note.tags || []).filter((tag) => tag.id != action.tagId),
      }));

      return {
        ...newState,
        tags: (state.tags || [])
          .map((tag) => (tag.id != action.tagId ? tag : { ...tag, notes: (tag.notes || []).filter((id) => id != action.noteId) }))
          .filter((tag) => tag.notes?.length > 0),
      };
    }

    case NUKE_NOTES:
      // Keep metadata so the user isn't treated as brand new
      return { ...GetInitialState(), metadata: state.metadata };

    case IMPORT_NOTES: {
      // action.notes is an exported `pages` object. Only notes that don't
      // already exist (by id) are added.
      const pages = { ...state.pages };

      Object.entries(action.notes || {}).forEach(([url, page]) => {
        const existingNotes = pages[url]?.notes || [];
        const existingIds = new Set(existingNotes.map((note) => note.id));
        const newNotes = (page?.notes || []).filter((note) => !existingIds.has(note.id));
        pages[url] = { ...pages[url], notes: [...existingNotes, ...newNotes] };
      });

      return { ...state, pages };
    }

    case HEARTIFY:
      return updateNote(state, action.url, action.id, (note) => ({ heart: !note.heart }));

    case RESIZE_NOTE:
      return updateNote(state, action.url, action.id, () => ({ size: { width: action.x } }));

    case CHANGE_COLOR:
      return updateNote(state, action.url, action.id, () => ({
        color: { title: action.color, text: getContrastingColor(action.color) },
      }));

    case MOVE_NOTE:
      return updateNote(state, action.url, action.id, () => ({ position: { x: action.x, y: action.y } }));

    case TOGGLE_VISIBILITY:
      return updateNote(state, action.url, action.id, () => ({ visible: action.visible }));

    case ADD_TITLE:
      return updateNote(state, action.url, action.id, () => ({ title: action.title }));

    case ADD_TEXT:
      return updateNote(state, action.url, action.id, () => ({ body: action.body }));

    case REMOVE_NOTE: {
      const newState = updatePageNotes(state, action.url, (notes) => notes.filter((note) => note.id != action.id));

      return {
        ...newState,
        tags: (state.tags || [])
          .map((tag) => ({ ...tag, notes: (tag.notes || []).filter((id) => id != action.id) }))
          .filter((tag) => tag.notes.length > 0),
      };
    }

    case ADD_NOTE:
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.url]: {
            ...state.pages?.[action.url],
            notes: [...(state.pages?.[action.url]?.notes || []), createNote(action)],
          },
        },
      };

    case USER_ONBOARDED:
      return { ...state, metadata: { ...state.metadata, onboarded: true } };

    case SET_ANALYTICS_ENABLED:
      return { ...state, metadata: { ...state.metadata, analytics_enabled: action.enabled } };

    default:
      return state;
  }
};

export default notesApp;
