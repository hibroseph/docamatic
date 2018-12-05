import {wrapStore} from 'react-chrome-redux';

console.log("Running background.js")

const notesStorageKey = `notes-${window.location.href}`

// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || '{"notes" : []}')

// This is used to reset the state if something is saved as undefined
// initialState = {notes:[]}

// Create the store
const store = createStore(notesApp, initialState)

store.subscribe(() => {
    const serialized = JSON.stringify(store.getState());
    localStorage.setItem(notesStorageKey, serialized)
    console.log(store.getState())
})

console.log("Inital state: ")
console.log(store.getState())


wrapStore(store, {portName: 'NOTES_STORE'})