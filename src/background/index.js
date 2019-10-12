import notesApp from "../redux/reducer";
import { wrapStore } from "react-chrome-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import { ENVIRONMENT, RELEASE, VERSION } from "../utils/constants";

Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: ENVIRONMENT,
  release: RELEASE + VERSION
});

const notesStorageKey = `notes-${window.location.href}`;

// localStorage.setItem(notesStorageKey, '{"notes" : []}')
// localStorage.setItem(notesStorageKey, '{}')

// This handles running the script which adds notes to the page and gets the position of the webpage
chrome.runtime.onMessage.addListener(function(message, callback) {
  if (message === "runContentScript") {
    chrome.tabs.executeScript({
      file: "index.js"
    });
  }
});

// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || "{}");

// Create the store
const store = createStore(notesApp, initialState);

store.subscribe(() => {
  console.log(store.getState());
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
});

wrapStore(store, { portName: "NOTES_STORE" });
