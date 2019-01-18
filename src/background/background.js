import {wrapStore} from 'react-chrome-redux';
import {createStore} from 'redux';
import notesApp from "../redux/reducer";
import * as Sentry from '@sentry/browser';

// Initializing Sentry
Sentry.init({ dsn: 'https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219' });

console.log("You are inside THE background.js")

Sentry.captureException("help");
Sentry.showReportDialog();


const notesStorageKey = `notes-${window.location.href}`

console.log("NOTES STORAGE KEY: " + notesStorageKey)
console.log(window)

// localStorage.setItem(notesStorageKey, '{"notes" : []}')
// localStorage.setItem(notesStorageKey, '{}')
// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || '{}')
// let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || '{"notes"}')


console.log("INITIALSTATE: ");
console.log(initialState);

// Create the store
const store = createStore(notesApp, initialState)

store.subscribe(() => {
    const serialized = JSON.stringify(store.getState());
    localStorage.setItem(notesStorageKey, serialized)
    console.log("Subscriber New State:")
    console.log(store.getState())
})

// console.log("Inital state: ")
// console.log(store.getState())


wrapStore(store, {portName: 'NOTES_STORE'})