export const REMOVE_NOTE = 'REMOVE_NOTE';
export const ADD_NOTE = 'ADD_NOTE';

let nextNoteId = 0
/*
 * action creators
 */

// export const removeNote = (id) => dispatch => {
//     dispatch({
//         type: REMOVE_NOTE,
//         id
//     })
// }


export function addNote(text) {
    return {
        type: ADD_NOTE,
        id: nextNoteId++,
        text
    }
}

export function removeNote(id) {
    // console.log
    return { 
        type: REMOVE_NOTE, 
        id 
    }
}
