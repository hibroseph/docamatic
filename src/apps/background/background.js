import notesApp from "../../redux/reducer";
import { wrapStore } from "webext-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import config from "../../../config.json";

let isInitialized = false;

console.debug(`Starting up Docamatic Background ${config.environment}:${config.release_prefix}:${config.version}`);
let feedbackUrl = "https://forms.gle/Wn3GFbDQwq4YqzFs9";

chrome.runtime.setUninstallURL(feedbackUrl);
let initialState = {};

const init = (preloadedState) => {
  console.debug("preloaded state:")
  console.debug(preloadedState)
  const store = createStore(notesApp, preloadedState);

  store.subscribe(() => {
    Sentry.wrap(() => {
      let currentState = store.getState();
      console.debug("Current store state:");
      console.debug(currentState);
      const serialized = JSON.stringify(currentState);
      chrome.storage.local.set({ notes: serialized }, () => {
        console.debug("successfull set " + serialized + " to store")

        chrome.storage.local.get(['notes'], (storage) =>
        console.log(JSON.parse(storage.notes)))
      })
    });
  });

  wrapStore(store, { portName: "NOTES_STORE" });

}
// Listens for incomming connections from content
// scripts, or from the popup. This will be triggered
// whenever the extension "wakes up" from idle.
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "POPUP" || port.name === "SCRIPT") {
    console.log("got popup message from " + port.name)
    // The popup was opened.
    // Gets the current state from the storage.
    chrome.storage.local.get('notes', (storage) => {
      console.debug("storage")
      console.debug(storage)

      if (!isInitialized) {
        console.debug("store is not initalized")
        // 1. Initializes the redux store and the message passing.
        init( JSON.parse(storage?.notes || '{}') || initialState);
        isInitialized = true;
      } else {
        console.debug("store is already initalized")
      }
      // 2. Sends a message to notify that the store is ready.
      
      console.debug("notifying the world that the store is initalized")
      
      if (port.name === "POPUP") 
        chrome.runtime.sendMessage({ type: "STORE_INITIALIZED" });
      else if (port.name === "SCRIPT")
      console.debug("TABS")
        console.debug(chrome.tabs)
        chrome.tabs.query({active: true}, tabs => {
          chrome.tabs.sendMessage(tabs[0].id,{ type: "STORE_INITIALIZED" })
        })
        
    
    });
  }
})

