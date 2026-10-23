import { sameSite } from "../utils/sameSite";
import { HINTS } from "../model/hints";
import { INITIAL_NOTE_WIDTH } from "../utils/constants";
import {
  ADD_NOTE,
  ADD_TAG,
  ADD_TEXT,
  ADD_TITLE,
  CHANGE_COLOR,
  DELETE_TAG,
  HEARTIFY,
  IMPORT_NOTES,
  LAYOUT_NOTE,
  MOVE_NOTE,
  NUKE_NOTES,
  REMOVE_NOTE,
  REMOVE_TAG,
  REPLACE_STATE,
  RESIZE_NOTE,
  RESTORE_NOTE,
  SET_ANALYTICS_ENABLED,
  SET_PAGE_TITLE,
  FILL_NOTE_DETAILS,
  DISMISS_HINT,
  SET_PREFERENCES,
  TOGGLE_VISIBILITY,
  UPDATE_TAG,
  USER_ONBOARDED,
} from "./actions";
import { generateUUID } from "../utils/GenerateUUID";
import { GetInitialState } from "../utils/GetInitialState";
import {
  DEFAULT_NOTE_COLOR,
  contrastingText,
  isNoteColorName,
  nextTagColor,
  noteColorValue,
  resolveNoteColor,
} from "../model/colors";

/*
 * State shape (full types in model/types.ts):
 * {
 *   pages: { [url]: { notes: Note[], title? } },
 *   tags: [{ id, text, color, notes: noteId[] }],
 *   metadata: { onboarded, analytics_enabled, schema_version, preferences? }
 * }
 *
 * A note and its tags are linked both ways (note.tags and tag.notes); every
 * case below that touches one side updates the other.
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

// Details older notes may lack, which FILL_NOTE_DETAILS can fill in once
// they're known, with what each must look like. To give older notes a new
// detail as it becomes known (instead of guessing it in a migration), add it
// here and dispatch fillNoteDetails where the detail is available.
const FILLABLE_NOTE_DETAILS = {
  // The full address the note is on (credentials removed: redactUrl), added
  // in 5.0; filled in on a visit to the exact page it's saved under
  created_on_url: (value, url) => typeof value === "string" && value.length <= 4096 && /^(https?|file):\/\//.test(value) && sameSite(value, url),
};

// Content edits record when they happened (actions carry `at`)
const edited = (action) => (action.at ? { updated_at: action.at } : {});

// A color name from the new palette, or a hex (a note going back to its
// original color from before 5.1)
const colorFor = (color) =>
  isNoteColorName(color)
    ? noteColorValue(color)
    : typeof color === "string" && /^#[0-9a-f]{3,8}$/i.test(color)
      ? { title: color, text: contrastingText(color) }
      : noteColorValue(DEFAULT_NOTE_COLOR);

const createNote = (action) => ({
  id: action.id,
  // Without an explicit position: a random horizontal position, as before 5.1
  position: action.position || { x: Math.floor(Math.random() * (600 + 1)), y: action.y_position },
  size: { width: action.width || INITIAL_NOTE_WIDTH },
  body: action.highlightedText || null,
  title: null,
  date_created: action.date_created,
  // Where the note was created, in full (credentials removed). Lets future
  // changes to which url notes are saved under re-file notes precisely.
  ...(action.created_on_url ? { created_on_url: action.created_on_url } : {}),
  color: colorFor(action.color || DEFAULT_NOTE_COLOR),
  stickify: false,
  heart: false,
  visible: action.visible !== false,
});

// Anchors come from web pages (content scripts), so only well-formed ones are kept
const finite = (n) => typeof n === "number" && Number.isFinite(n);
const validAnchor = (anchor) => {
  if (!anchor || typeof anchor !== "object" || !finite(anchor.x) || !finite(anchor.y)) return null;
  if (anchor.kind === "viewport") return { kind: "viewport", x: anchor.x, y: anchor.y };
  if (anchor.kind === "element" && typeof anchor.selector === "string" && anchor.selector && anchor.selector.length <= 500) {
    const hint = anchor.hint;
    return {
      kind: "element",
      selector: anchor.selector,
      x: anchor.x,
      y: anchor.y,
      ...(finite(anchor.w) ? { w: anchor.w } : {}),
      ...(hint && finite(hint.x) && finite(hint.y) ? { hint: { x: hint.x, y: hint.y, screen: hint.screen === true } } : {}),
    };
  }
  return null;
};

const sameText = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// Removes a note id from every tag, dropping tags left without notes
const withoutNoteInTags = (tags, noteId) =>
  (tags || [])
    .map((tag) => ({ ...tag, notes: (tag.notes || []).filter((id) => id != noteId) }))
    .filter((tag) => tag.notes.length > 0);

const notesApp = (state = GetInitialState(), action) => {
  switch (action.type) {
    case ADD_TAG: {
      const text = String(action.text ?? "").trim();
      if (!text) return state;

      const tags = state.tags || [];
      // "Cooking" and "cooking" are the same tag
      const existingTag = tags.find((tag) => sameText(tag.text, text));

      if (existingTag?.notes?.includes(action.noteId)) {
        return state;
      }

      const tagId = existingTag ? existingTag.id : generateUUID();

      const newState = updateNote(state, action.url, action.noteId, (note) => ({
        tags: [...(note.tags || []).filter((tag) => tag.id != tagId), { id: tagId }],
        ...edited(action),
      }));

      if (newState === state) {
        return state;
      }

      return {
        ...newState,
        tags: existingTag
          ? tags.map((tag) => (tag.id === tagId ? { ...tag, notes: [...(tag.notes || []), action.noteId] } : tag))
          : [...tags, { id: tagId, color: nextTagColor(tags), text, notes: [action.noteId] }],
      };
    }

    case REMOVE_TAG: {
      // Remove the tag from the note, and the note from the tag. Tags that are
      // no longer on any note are deleted.
      const newState = updateNote(state, action.url, action.noteId, (note) => ({
        tags: (note.tags || []).filter((tag) => tag.id != action.tagId),
        ...edited(action),
      }));

      return {
        ...newState,
        tags: (state.tags || [])
          .map((tag) => (tag.id != action.tagId ? tag : { ...tag, notes: (tag.notes || []).filter((id) => id != action.noteId) }))
          .filter((tag) => tag.notes?.length > 0),
      };
    }

    case UPDATE_TAG: {
      const tags = state.tags || [];
      const tag = tags.find((t) => t.id === action.tagId);
      if (!tag) return state;

      const text = action.text !== undefined ? String(action.text).trim() : tag.text;
      if (!text) return state;
      const color = action.color || tag.color;

      // Renamed to the name of another tag: they become one tag
      const other = tags.find((t) => t.id !== tag.id && sameText(t.text, text));
      if (!other) {
        return { ...state, tags: tags.map((t) => (t.id === tag.id ? { ...t, text, color } : t)) };
      }

      const pages = Object.fromEntries(
        Object.entries(state.pages || {}).map(([url, page]) => [
          url,
          {
            ...page,
            notes: (page.notes || []).map((note) => {
              if (!(note.tags || []).some((t) => t.id === tag.id)) return note;
              const rest = note.tags.filter((t) => t.id !== tag.id && t.id !== other.id);
              return { ...note, tags: [...rest, { id: other.id }] };
            }),
          },
        ])
      );
      return {
        ...state,
        pages,
        tags: tags
          .filter((t) => t.id !== tag.id)
          .map((t) => (t.id === other.id ? { ...t, notes: [...new Set([...(t.notes || []), ...(tag.notes || [])])] } : t)),
      };
    }

    case DELETE_TAG: {
      if (!(state.tags || []).some((tag) => tag.id === action.tagId)) return state;
      const pages = Object.fromEntries(
        Object.entries(state.pages || {}).map(([url, page]) => [
          url,
          {
            ...page,
            notes: (page.notes || []).map((note) =>
              (note.tags || []).some((t) => t.id === action.tagId)
                ? { ...note, tags: note.tags.filter((t) => t.id !== action.tagId) }
                : note
            ),
          },
        ])
      );
      return { ...state, pages, tags: state.tags.filter((tag) => tag.id !== action.tagId) };
    }

    case NUKE_NOTES:
      // Keep metadata so the user isn't treated as brand new
      return { ...GetInitialState(), metadata: state.metadata };

    case IMPORT_NOTES: {
      // action.notes is a `pages` object, action.tags a tags array. Only adds:
      // notes that already exist (by id) are kept as they are, and tags that
      // already exist (by id) just gain the imported notes.
      const pages = { ...state.pages };

      Object.entries(action.notes || {}).forEach(([url, page]) => {
        const existingNotes = pages[url]?.notes || [];
        const existingIds = new Set(existingNotes.map((note) => note.id));
        const newNotes = (page?.notes || []).filter((note) => !existingIds.has(note.id));
        pages[url] = {
          ...(page?.title ? { title: page.title } : {}),
          ...pages[url],
          notes: [...existingNotes, ...newNotes],
        };
      });

      const tags = [...(state.tags || [])];
      (action.tags || []).forEach((importedTag) => {
        const index = tags.findIndex((tag) => tag.id === importedTag.id);
        if (index === -1) {
          tags.push(importedTag);
        } else {
          const noteIds = new Set([...(tags[index].notes || []), ...(importedTag.notes || [])]);
          tags[index] = { ...tags[index], notes: [...noteIds] };
        }
      });

      return { ...state, pages, tags };
    }

    case RESTORE_NOTE: {
      // Undo of a delete: the note goes back on its page, with its tags
      const note = action.note;
      if (!note?.id || !action.url) return state;
      const page = state.pages?.[action.url];
      if (page?.notes?.some((n) => n.id === note.id)) return state;

      const tags = [...(state.tags || [])];
      (action.tags || []).forEach((snapshot) => {
        const index = tags.findIndex((tag) => tag.id === snapshot.id);
        if (index === -1) {
          tags.push({ id: snapshot.id, text: snapshot.text, color: snapshot.color, notes: [note.id] });
        } else if (!tags[index].notes?.includes(note.id)) {
          tags[index] = { ...tags[index], notes: [...(tags[index].notes || []), note.id] };
        }
      });

      return {
        ...state,
        pages: { ...state.pages, [action.url]: { ...page, notes: [...(page?.notes || []), note] } },
        tags,
      };
    }

    case REPLACE_STATE:
      // Validated (and the current notes backed up) by the background first
      return action.state;

    case LAYOUT_NOTE:
      // Replaces the note (rather than merging) so fields can be removed
      return updatePageNotes(state, action.url, (notes) =>
        notes.map((note) => {
          if (note.id !== action.id) return note;
          let next = { ...note };
          if (typeof action.pinned === "boolean" && finite(action.position?.x) && finite(action.position?.y)) {
            // Pinned notes keep their position on screen, others on the page.
            // Either way what it was anchored to no longer applies.
            const { anchor, ...rest } = next;
            next = { ...rest, stickify: action.pinned, position: { x: action.position.x, y: action.position.y } };
          }
          if (typeof action.collapsed === "boolean") next.collapsed = action.collapsed;
          if (action.height === null) {
            const { height, ...size } = next.size || {};
            next.size = size;
          } else if (finite(action.height)) {
            next.size = { ...next.size, height: Math.max(60, Math.round(action.height)) };
          }
          return next;
        })
      );

    case HEARTIFY:
      return updateNote(state, action.url, action.id, (note) => ({ heart: !note.heart }));

    case RESIZE_NOTE:
      // Keeps a set height (size.height): only the width changes here
      return updateNote(state, action.url, action.id, (note) => ({ size: { ...note.size, width: action.x } }));

    case CHANGE_COLOR:
      return updateNote(state, action.url, action.id, (note) => {
        // A note from before 5.1 remembers its first color, so it can go back to it
        const original = note.color?.original || (resolveNoteColor(note.color).kind === "legacy" ? note.color.title : undefined);
        return { color: { ...colorFor(action.color), ...(original ? { original } : {}) }, ...edited(action) };
      });

    case MOVE_NOTE:
      // Replaces the note (rather than merging) so an anchor can be removed
      return updatePageNotes(state, action.url, (notes) =>
        notes.map((note) => {
          if (note.id !== action.id) return note;
          const { anchor: oldAnchor, ...rest } = note;
          const moved = { ...rest, position: { x: action.x, y: action.y } };
          if (!("anchor" in action)) return oldAnchor ? { ...moved, anchor: oldAnchor } : moved;
          const anchor = validAnchor(action.anchor);
          // No valid anchor: back on the page, like notes have always been
          return anchor ? { ...moved, anchor } : moved;
        })
      );

    case TOGGLE_VISIBILITY:
      return updateNote(state, action.url, action.id, () => ({ visible: action.visible }));

    case ADD_TITLE:
      return updateNote(state, action.url, action.id, () => ({ title: action.title, ...edited(action) }));

    case ADD_TEXT:
      return updateNote(state, action.url, action.id, () => ({ body: action.body, ...edited(action) }));

    case REMOVE_NOTE: {
      const newState = updatePageNotes(state, action.url, (notes) => notes.filter((note) => note.id != action.id));
      return { ...newState, tags: withoutNoteInTags(state.tags, action.id) };
    }

    case ADD_NOTE: {
      const page = state.pages?.[action.url];
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.url]: {
            ...page,
            ...(action.page_title ? { title: String(action.page_title).slice(0, 300) } : {}),
            notes: [...(page?.notes || []), createNote(action)],
          },
        },
      };
    }

    case FILL_NOTE_DETAILS: {
      // Details older notes didn't save, filled in when they become known
      // (see fillNoteDetails). Only missing ones, only these fields.
      const fill = Object.fromEntries(
        Object.entries(action.details || {}).filter(([key, value]) => FILLABLE_NOTE_DETAILS[key]?.(value, action.url))
      );
      const note = state.pages?.[action.url]?.notes?.find((n) => n.id === action.id);
      if (!note) return state;
      const missing = Object.fromEntries(Object.entries(fill).filter(([key]) => note[key] === undefined || note[key] === null));
      if (Object.keys(missing).length === 0) return state;
      return updateNote(state, action.url, action.id, () => missing);
    }

    case SET_PAGE_TITLE: {
      // Only pages that have notes; the title is shown in lists of notes
      const page = state.pages?.[action.url];
      const title = String(action.title ?? "").trim().slice(0, 300);
      if (!page || !title || page.title === title) return state;
      return { ...state, pages: { ...state.pages, [action.url]: { ...page, title } } };
    }

    case USER_ONBOARDED:
      return { ...state, metadata: { ...state.metadata, onboarded: true } };

    case DISMISS_HINT: {
      // First-time hints (model/hints.ts): only known ones
      if (!HINTS.includes(action.name) || state.metadata?.hints?.[action.name]) return state;
      return { ...state, metadata: { ...state.metadata, hints: { ...state.metadata?.hints, [action.name]: true } } };
    }

    case SET_ANALYTICS_ENABLED:
      return { ...state, metadata: { ...state.metadata, analytics_enabled: action.enabled } };

    case SET_PREFERENCES:
      return {
        ...state,
        metadata: { ...state.metadata, preferences: { ...state.metadata?.preferences, ...action.preferences } },
      };

    default:
      return state;
  }
};

export default notesApp;
