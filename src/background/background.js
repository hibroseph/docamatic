import { wrapStore } from "react-chrome-redux";
import { createStore } from "redux";
import notesApp from "../redux/reducer";
import * as Sentry from "@sentry/browser";
import { ENVIRONMENT, RELEASE, VERSION } from "../utils/constants"

Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: ENVIRONMENT,
  release: RELEASE + VERSION
});

// console.log("The background script is running!");
// console.log("You are inside THE background.js");

const notesStorageKey = `notes-${window.location.href}`;

// console.log("NOTES STORAGE KEY: " + notesStorageKey);
// console.log(window);

// localStorage.setItem(notesStorageKey, '{"notes" : []}')
// localStorage.setItem(notesStorageKey, '{}')


// This handles running the script which adds notes to the page and gets the position of the webpage
chrome.runtime.onMessage.addListener(function(message, callback) {
  console.log("Message: " );
  console.log(message);
  if (message === "runContentScript") {
    console.log("Running script");
    chrome.tabs.executeScript({
      file: "index.js"
    });
  }
});



// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || "{}");

// console.log("INITIALSTATE: ");
// console.log(initialState);

// Create the store
const store = createStore(notesApp, initialState);

store.subscribe(() => {
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
  // console.log("Subscriber New State:");
  // console.log(store.getState());
});

// console.log("Inital state: ")
// console.log(store.getState())

wrapStore(store, { portName: "NOTES_STORE" });
