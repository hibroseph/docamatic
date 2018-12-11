export const REMOVE_NOTE = "REMOVE_NOTE";
export const ADD_NOTE = "ADD_NOTE";
export const ADD_TEXT = "ADD_TEXT";
export const ADD_TITLE = "ADD_TITLE";
export const MOVE_NOTE = "MOVE_NOTE";
export const CHANGE_COLOR = "CHANGE_COLOR";
export const CLICKED_NOTE = "CLICKED_NOTE";
export const RESIZE_NOTE = "RESIZE_NOTE";

/*
 * action creators
 */
export function updateNoteSize(id, x, y) {
  return {
    type: RESIZE_NOTE,
    id,
    x,
    y
  };
}

export function updateNoteDepth(id) {
  return {
    type: CLICKED_NOTE,
    id
  };
}

export function changeNoteColor(id) {
  return {
    type: CHANGE_COLOR,
    id
  };
}

export function updateNotePosition(id, x, y) {
  return {
    type: MOVE_NOTE,
    id,
    x,
    y
  };
}

export function addTitle(id, text) {
  return {
    type: ADD_TITLE,
    id: id,
    title: text
  };
}

export function addText(id, text) {
  return {
    type: ADD_TEXT,
    id: id,
    body: text
  };
}

export function addNote(title, id, y_position, page) {
  return {
    type: ADD_NOTE,
    id: id,
    title,
    y_position,
    page
  };
}

export function removeNote(id) {
  return {
    type: REMOVE_NOTE,
    id
  };
}
