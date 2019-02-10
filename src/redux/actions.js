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
export function updateNoteSize(id, x, y, page) {
  return {
    type: RESIZE_NOTE,
    id,
    x,
    y,
    page
  };
}

export function updateNoteDepth(id) {
  return {
    type: CLICKED_NOTE,
    id
  };
}

export function changeNoteColor(id, page, color) {
  return {
    type: CHANGE_COLOR,
    id,
    page,
    color
  };
}

export function updateNotePosition(id, x, y, page) {
  return {
    type: MOVE_NOTE,
    id,
    x,
    y,
    page
  };
}

export function addTitle(id, text, page) {
  console.log("actions.js: adding title: " + text + " on the page: " + page);
  return {
    type: ADD_TITLE,
    id: id,
    title: text,
    page
  };
}

export function addText(id, text, title, page) {
  console.log("actions.js: adding text: " + text + " on page " + page);

  return {
    type: ADD_TEXT,
    id: id,
    body: text,
    currentPage : page
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

export function removeNote(id, page) {
  return {
    type: REMOVE_NOTE,
    id
  };
}
