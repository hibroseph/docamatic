import notesApp from "../../redux/reducer";
import { wrapStore } from "webext-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import config from "../../../config.json";

let isInitialized = false;

console.debug(`Starting up Docamatic Background ${config.environment}:${config.release_prefix}:${config.version}`);
let feedbackUrl = "https://forms.gle/Wn3GFbDQwq4YqzFs9";

chrome.runtime.setUninstallURL(feedbackUrl);
let initialState = {
  pages: {},
  tags: []
};


const init = (preloadedState) => {
  const store = createStore(notesApp, preloadedState);
  store.subscribe(() => {
    Sentry.wrap(() => {
      let currentState = store.getState();
      chrome.storage.local.set(currentState)
    });
  });

  wrapStore(store, { portName: "NOTES_STORE" });

}

// Listens for incomming connections from content
// scripts, or from the popup. This will be triggered
// whenever the extension "wakes up" from idle.
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "POPUP" || port.name === "SCRIPT") {

    // The popup was opened.
    // Gets the current state from the storage.
    chrome.storage.local.get(null, (storage) => {
      if (!isInitialized) {
        // 1. Initializes the redux store and the message passing.

        if (Object.keys(storage).length == 0) {
          storage = initialState;
        }
        init( storage);
        isInitialized = true;
      }
      // 2. Sends a message to notify that the store is ready.
      if (port.name === "POPUP") 
        chrome.runtime.sendMessage({ type: "STORE_INITIALIZED" });
      else if (port.name === "SCRIPT")
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          chrome.tabs.sendMessage(tabs[0].id,{ type: "STORE_INITIALIZED" })
        })
    });
  }
})

