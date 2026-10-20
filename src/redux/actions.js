export const REMOVE_NOTE = "REMOVE_NOTE";
export const ADD_NOTE = "ADD_NOTE";
export const ADD_TEXT = "ADD_TEXT";
export const ADD_TITLE = "ADD_TITLE";
export const MOVE_NOTE = "MOVE_NOTE";
export const CHANGE_COLOR = "CHANGE_COLOR";
export const RESIZE_NOTE = "RESIZE_NOTE";
export const HEARTIFY = "HEARTIFY";
export const TOGGLE_VISIBILITY = "TOGGLE_VISIBILITY";
export const IMPORT_NOTES = "IMPORT_NOTES";
export const NUKE_NOTES = "NUKE_NOTES";
export const ADD_TAG = "ADD_TAG";
export const REMOVE_TAG = "REMOVE_TAG"
export const USER_ONBOARDED = "USER_ONBOARDED"
export const SET_ANALYTICS_ENABLED = "SET_ANALYTICS_ENABLED"
// Not a state change: carries an analytics event to the background
export const TRACK = "TRACK"
// Replaces all notes, tags and settings (restoring an automatic backup)
export const REPLACE_STATE = "REPLACE_STATE"
// Since 5.1
export const RESTORE_NOTE = "RESTORE_NOTE"
export const SET_PAGE_TITLE = "SET_PAGE_TITLE"
export const UPDATE_TAG = "UPDATE_TAG"
export const DELETE_TAG = "DELETE_TAG"
export const SET_PREFERENCES = "SET_PREFERENCES"

/*
 * action creators
 */
// Edits carry the time they were made (`at`), so the reducer stays a pure
// function while still recording when a note last changed (updated_at)
export const addTag = (noteId, url, text) => {
  return {
    type: ADD_TAG,
    noteId,
    text,
    url,
    at: Date.now(),
  }
}


export const removeTag = (noteId, url, tagId) => {
  return {
    type: REMOVE_TAG,
    noteId,
    url,
    tagId,
    at: Date.now(),
  }
}

export function nukeNotes() {
  return {
    type: NUKE_NOTES,
  };
}

// Merges notes (a url-keyed `pages` object) and tags into the current ones.
// Only adds: notes and tags that already exist are left as they are.
export function importNotes(pages, tags = []) {
  return {
    type: IMPORT_NOTES,
    notes: pages,
    tags,
  };
}

export function replaceState(state) {
  return {
    type: REPLACE_STATE,
    state,
  };
}

export function toggleVisibility(id, url, visible) {
  return {
    type: TOGGLE_VISIBILITY,
    id,
    visible,
    url,
  };
}

export function heartify(id, url) {
  return {
    type: HEARTIFY,
    id,
    url,
  };
}

export function updateNoteSize(id, x, url) {
  return {
    type: RESIZE_NOTE,
    id,
    x,
    url,
  };
}

/** @param color a note color name ("yellow", ...) or, to go back to a note's original color, its hex */
export function changeNoteColor(id, url, color) {
  return {
    type: CHANGE_COLOR,
    id,
    url,
    color,
    at: Date.now(),
  };
}

/**
 * @param x, y page coordinates of the note's top left corner
 * @param anchor since 5.1: what the note moves with when things scroll
 *   (page/anchor.ts), or null for the page. Left out: unchanged.
 */
export function updateNotePosition(id, x, y, url, anchor) {
  return {
    type: MOVE_NOTE,
    id,
    x,
    y,
    url,
    ...(anchor !== undefined ? { anchor } : {}),
  };
}

export function addTitle(id, text, url) {
  return {
    type: ADD_TITLE,
    id: id,
    title: text,
    url,
    at: Date.now(),
  };
}

export function addText(id, text, url) {
  return {
    type: ADD_TEXT,
    id: id,
    body: text,
    url,
    at: Date.now(),
  };
}

/**
 * @param url the url the note is saved under (noteUrlFor)
 * @param createdOnUrl the full address it was created on, credentials
 *   removed (redactUrl); kept as a record, see utils/noteUrl.js
 * @param options since 5.1, all optional:
 *   position {x, y}  where to put it (model/placement.js); without it the
 *                    note goes at y_position and a random x, as before
 *   width            note width
 *   color            note color name (model/colors.ts)
 *   visible          false for a note that only shows in the side panel/popup
 *   pageTitle        the page's title, shown in lists instead of the url
 */
export function addNote(id, y_position, url, createdOnUrl, options = {}) {
  return {
    type: ADD_NOTE,
    id: id,
    y_position,
    url,
    created_on_url: createdOnUrl,
    date_created: new Date().getTime(),
    ...(options.position ? { position: options.position } : {}),
    ...(options.width ? { width: options.width } : {}),
    ...(options.color ? { color: options.color } : {}),
    ...(options.visible === false ? { visible: false } : {}),
    ...(options.pageTitle ? { page_title: options.pageTitle } : {}),
  };
}

/** Puts a deleted note back (Undo), with the tags it had */
export function restoreNote(url, note, tags = []) {
  return {
    type: RESTORE_NOTE,
    url,
    note,
    tags,
  };
}

/** Saves a page's title, shown in lists instead of its address */
export function setPageTitle(url, title) {
  return {
    type: SET_PAGE_TITLE,
    url,
    title,
  };
}

/** Renames and/or recolors a tag everywhere it's used */
export function updateTag(tagId, { text, color } = {}) {
  return {
    type: UPDATE_TAG,
    tagId,
    ...(text !== undefined ? { text } : {}),
    ...(color !== undefined ? { color } : {}),
  };
}

/** Removes a tag from every note (the notes stay) */
export function deleteTag(tagId) {
  return {
    type: DELETE_TAG,
    tagId,
  };
}

/** Merges into metadata.preferences (theme, new note color) */
export function setPreferences(preferences) {
  return {
    type: SET_PREFERENCES,
    preferences,
  };
}

export function removeNote(id, url) {
  return {
    type: REMOVE_NOTE,
    id,
    url,
  }; 
}

export function userOnboarded() {
  return {
    type: USER_ONBOARDED
  }
}

export function setAnalyticsEnabled(enabled) {
  return {
    type: SET_ANALYTICS_ENABLED,
    enabled,
  };
}

export function trackEvent(event, properties) {
  return {
    type: TRACK,
    event,
    properties,
  };
}
