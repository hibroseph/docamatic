import notesApp from "../../redux/reducer";
import { wrapStore } from "webext-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import config from "../../../config.json";

let isInitialized = false;

const notesStorageKey = `notes`;
console.debug(`Starting up Docamatic Background ${config.environment}:${config.release_prefix}:${config.version}`);
let feedbackUrl = "https://forms.gle/Wn3GFbDQwq4YqzFs9";

chrome.runtime.setUninstallURL(feedbackUrl);
let initialState = {};

const init = (preloadedState) => {
  const store = createStore(notesApp, preloadedState);

  store.subscribe(() => {
    Sentry.wrap(() => {
      let currentState = store.getState();
      console.debug("Current store state:");
      console.debug(currentState);
      const serialized = JSON.stringify(currentState);
      chrome.storage.local.set({ notesStorageKey: serialized })
    });
  });

  wrapStore(store, { portName: "NOTES_STORE" });

}
// Listens for incomming connections from content
// scripts, or from the popup. This will be triggered
// whenever the extension "wakes up" from idle.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "POPUP") {
    console.log("got popup message from popup")
    // The popup was opened.
    // Gets the current state from the storage.
    chrome.storage.local.get(notesStorageKey, (storage) => {
      if (!isInitialized) {
        // 1. Initializes the redux store and the message passing.
        init(storage.state || initialState);
        isInitialized = false;
      }
      // 2. Sends a message to notify that the store is ready.
      chrome.runtime.sendMessage({ type: "STORE_INITIALIZED" });
    });
  }
});


