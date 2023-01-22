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

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({url : "/onboarding.html"}, () =>{ })
})


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
  
  let splitPort = port.name.split(";;")
  if (splitPort[0] === "POPUP" || splitPort[0] === "SCRIPT") {

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
      if (splitPort[0] === "POPUP") 
        chrome.runtime.sendMessage({ type: "STORE_INITIALIZED" });
      else if (splitPort[0] === "SCRIPT")
        chrome.tabs.query({url: splitPort[1], lastFocusedWindow: true}, tabs => {
          console.log("tabs returned with query " + splitPort[1])
          console.log(tabs)
          tabs.map(tab => {
            try {
              chrome.tabs.sendMessage(tab.id,{ type: "STORE_INITIALIZED" }).catch(err => console.log("oppsie"))
            } 
            catch(ex) {
              console.log("swollowing exception")
            }  });
        })
    });
  }
})

