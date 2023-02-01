import notesApp from "../../redux/reducer";
import { wrapStore } from "webext-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import config from "../../../config.json";
import { GetInitialState } from "../../utils/GetInitialState";
import { migrate } from "./migrations";
import { handleMetrics } from "./metrics";

let isInitialized = false;

console.debug(`Starting up Docamatic Background ${config.environment}:${config.release_prefix}:${config.version}`);

if (config.environment == "uat" || config.environment == "production") {
  chrome.runtime.setUninstallURL(config.feedbackUrl);
}

let store;

const getStateFromStorage = () => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(null, (storage) => {
        if (Object.keys(storage).length == 0) {
          console.log("storage was empty, returning initial state");
          var migratedStorage = migrate(GetInitialState());

          chrome.storage.local.set(migratedStorage);
          resolve(migratedStorage);
        } else {
          console.log("there was something stored in storage.local, returning that");
          var migratedStorage = migrate(storage);
          console.debug("Saving migrated storage");
          chrome.storage.local.set(migratedStorage);
          resolve(migratedStorage);
        }
      });
    } catch (err) {
      console.log("rejecting");
      reject(err);
    }
  });
};

const CreateAndWrapStore = (storage) => {
  console.debug("Creating and wrapping store");
  store = createStore(notesApp, storage);
  store.subscribe(() => {
    Sentry.wrap(() => {
      console.debug("New state happened, let's get it and save it to local storage");
      let currentState = store.getState();
      console.log("Current State After Saving");
      console.debug(currentState);
      chrome.storage.local.set(currentState);
    });
  });

  console.debug("Wrapping store");
  wrapStore(store, { portName: "NOTES_STORE" });
};

const init = (preloadedState) => {
  if (!store) {
    CreateAndWrapStore(storage);
  }

  if (!preloadedState?.metadata?.onboarded) {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.tabs.create({ url: "/onboarding.html" }, () => {});
    });
  }
};

// Listens for incomming connections from content
// scripts, or from the popup. This will be triggered
// whenever the extension "wakes up" from idle.
chrome.runtime.onConnect.addListener((port) => {
  let splitPort = port.name.split(";;");
  if (splitPort[0] === "POPUP" || splitPort[0] === "SCRIPT") {
    // The popup was opened.
    // Gets the current state from the storage.

    getStateFromStorage().then((storage) => {
      // 1. See if we are initialized
      console.debug("checking to see if we are init'ed");
      if (!isInitialized) {
        console.debug("we are not inited, initing");
        init(storage);
        isInitialized = true;
      } else {
        console.debug("we have inited");
      }

      // 2. Sends a message to notify that the store is ready.
      if (splitPort[0] === "POPUP") chrome.runtime.sendMessage({ type: "STORE_INITIALIZED" });
      else if (splitPort[0] === "SCRIPT")
        chrome.tabs.query({ url: splitPort[1], lastFocusedWindow: true }, (tabs) => {
          console.log("tabs returned with query " + splitPort[1]);
          console.log(tabs);
          tabs.map((tab) => {
            try {
              chrome.tabs.sendMessage(tab.id, { type: "STORE_INITIALIZED" }).catch((err) => console.log("oppsie"));
            } catch (ex) {
              console.log("swollowing exception");
            }
          });
        });
    });
  }
});

console.log("calling getStateFromStorage");

getStateFromStorage().then((storage) => {
  console.log("we got storage");
  console.log(storage);

  if (!storage?.metadata?.onboarded) {
    console.log("you are not onboarded");
    chrome.tabs.create({ url: "/onboarding.html" }, () => {});
  } else {
    console.log("you are already onboarded");
  }

  if (!store) {
    CreateAndWrapStore(storage);
    store = createStore(notesApp, storage);
    store.subscribe(() => {
      Sentry.wrap(() => {
        console.debug("saving store");
        let currentState = store.getState();
        console.log("Current State After Saving");
        console.debug(currentState);
        chrome.storage.local.set(currentState);
      });
    });

    wrapStore(store, { portName: "NOTES_STORE" });
  }

  setTimeout(() => {
    console.debug("Checking to see if we should send metrics in timeout");
    handleMetrics(store);
  }, config.send_metrics_every_x_seconds * 1000);
});

console.log("after getStateFromStorage");
