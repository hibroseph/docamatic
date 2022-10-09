import notesApp from "../redux/reducer";
import { wrapStore } from "webext-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import { ENVIRONMENT, RELEASE, VERSION } from "../utils/constants";

Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: ENVIRONMENT,
  release: RELEASE + VERSION,
});
console.debug(`Starting up Docamatic Background ${ENVIRONMENT}:${RELEASE}:${VERSION}`);
let feedbackUrl = "https://forms.gle/Wn3GFbDQwq4YqzFs9";
const notesStorageKey = `notes`;

chrome.runtime.setUninstallURL(feedbackUrl);

let initialState = {};

chrome.storage.local.get(notesStorageKey, (storage) => {
  initialState = JSON.parse(storage.state || "{}");
});

// See if we have previously saved a state and if not, insert an empty array
//let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || "{}");

// Create the store
const store = createStore(notesApp, initialState);

store.subscribe(() => {
  let currentState = store.getState();
  console.debug("Current store state:");
  console.debug(currentState);
  const serialized = JSON.stringify(currentState);
  chrome.storage.local.set({ notesStorageKey: serialized }, () => {
    console.debug("Successfully set ");
    console.debug(serialized);
    console.debug(`to key ${notesStorageKey}`);
  });
});

wrapStore(store, { portName: "NOTES_STORE" });
