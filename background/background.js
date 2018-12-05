import {wrapStore} from 'react-chrome-redux';
import {createStore} from 'redux';
import notesApp from ''

// console.log("You are inside background.js")

const notesStorageKey = `notes-${window.location.href}`

// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || '{"notes" : []}')

// This is used to reset the state if something is saved as undefined
// initialState = {notes:[]}

// Create the store
const store = createStore(notesApp, initialState)


console.log("Inital state: ")
console.log(store.getState())


wrapStore(store, {portName: 'NOTES_STORE'})