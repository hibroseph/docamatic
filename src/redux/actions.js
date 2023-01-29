export const REMOVE_NOTE = "REMOVE_NOTE";
export const ADD_NOTE = "ADD_NOTE";
export const ADD_TEXT = "ADD_TEXT";
export const ADD_TITLE = "ADD_TITLE";
export const MOVE_NOTE = "MOVE_NOTE";
export const CHANGE_COLOR = "CHANGE_COLOR";
export const CLICKED_NOTE = "CLICKED_NOTE";
export const RESIZE_NOTE = "RESIZE_NOTE";
export const NOTE_DEPTH = "MOVE_NOTE";
export const STICKIFY = "STICKIFY";
export const HEARTIFY = "HEARTIFY";
export const TOGGLE_VISIBILITY = "TOGGLE_VISIBILITY";
export const IMPORT_NOTES = "IMPORT_NOTES";
export const NUKE_NOTES = "NUKE_NOTES";
export const ADD_TAG = "ADD_TAG";
export const REMOVE_TAG = "REMOVE_TAG";
export const USER_ONBOARDED = "USER_ONBOARDED";
export const SAVE_ERROR = "SAVE_ERROR";
export const ADD_TRACKING_EVENT = "ADD_TRACKING_EVENT";
export const CAN_TRACK = "CAN_TRACK";

export const saveError = (message, stackTrace) => {
  return {
    type: SAVE_ERROR,
    message,
    stacktrace,
    date: Date.now(),
  };
};

export const setCanTrack = (canTrack) => {
  return {
    type: CAN_TRACK,
    canTrack,
  };
};

export const clearErrors = () => {};

export const addTrackingEvent = (event, data) => {
  return {
    type: ADD_TRACKING_EVENT,
    event,
    data,
    date: Date.now(),
  };
};
/*
 * action creators
 */
export const addTag = (noteId, url, text) => {
  return {
    type: ADD_TAG,
    noteId,
    text,
    url,
  };
};

export const removeTag = (noteId, url, tagId) => {
  return {
    type: REMOVE_TAG,
    noteId,
    url,
    tagId,
  };
};

export function nukeNotes() {
  return {
    type: NUKE_NOTES,
  };
}

export function importNotes(notes, closePopup) {
  return {
    type: IMPORT_NOTES,
    notes,
    closePopup: closePopup,
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

export function stickify(id, url) {
  return {
    type: STICKIFY,
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

export function updateNoteDepth(id, url) {
  return {
    type: CLICKED_NOTE,
    id,
    url,
  };
}

export function changeNoteColor(id, url, color) {
  return {
    type: CHANGE_COLOR,
    id,
    url,
    color,
  };
}

export function updateNotePosition(id, x, y, url) {
  return {
    type: MOVE_NOTE,
    id,
    x,
    y,
    url,
  };
}

export function addTitle(id, text, url) {
  return {
    type: ADD_TITLE,
    id: id,
    title: text,
    url,
  };
}

export function addText(id, text, url) {
  return {
    type: ADD_TEXT,
    id: id,
    body: text,
    url,
  };
}

export function addNote(id, y_position, url) {
  return {
    type: ADD_NOTE,
    id: id,
    y_position,
    url,
    date_created: new Date().getTime(),
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
    type: USER_ONBOARDED,
  };
}
