import notesApp from "../redux/reducer";
import { wrapStore } from "react-chrome-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import { ENVIRONMENT, RELEASE, VERSION } from "../utils/constants";

Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: ENVIRONMENT,
  release: RELEASE + VERSION,
});

let feedbackUrl = "https://forms.gle/Wn3GFbDQwq4YqzFs9";
const notesStorageKey = `notes-${window.location.href}`;

chrome.runtime.setUninstallURL(feedbackUrl);

// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || "{}");

// Create the store
const store = createStore(notesApp, initialState);

store.subscribe(() => {
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
});

wrapStore(store, { portName: "NOTES_STORE" });
