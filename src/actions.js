export const REMOVE_NOTE = 'REMOVE_NOTE';
export const ADD_NOTE = 'ADD_NOTE';
export const ADD_TEXT = 'ADD_TEXT';
export const ADD_TITLE = 'ADD_TITLE';

/*
 * action creators
 */
export function addTitle(id, text) {
    return {
        type: ADD_TITLE,
        id: id,
        title: text
    }
}

export function addText(id, text) {
    return {
        type: ADD_TEXT,
        id: id,
        body: text 
    }
}

export function addNote(text, title, id) {
    return {
        type: ADD_NOTE,
        id: id,
        text,
        title
    }
}

export function removeNote(id) {
    return { 
        type: REMOVE_NOTE, 
        id 
    }
}
