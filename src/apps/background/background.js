import notesApp from "../../redux/reducer";
import { wrapStore } from "webext-redux";
import { createStore } from "redux";
import * as Sentry from "@sentry/browser";
import config from "../../../config.json";
import { GetInitialState } from "../../utils/GetInitialState";
import { generateUUID } from "../../utils/GenerateUUID";
import { clearTrackingEvents, CLEAR_TRACKING_EVENTS, resetTrackingTimer } from "../../redux/actions";

let isInitialized = false;
const SEND_METRICS_EVERY_SECONDS = 60;

console.debug(`Starting up Docamatic Background ${config.environment}:${config.release_prefix}:${config.version}`);
let feedbackUrl = "https://forms.gle/Wn3GFbDQwq4YqzFs9";

chrome.runtime.setUninstallURL(feedbackUrl);

const migrate = (storage) => {
  console.debug("migrating");

  var migrationsApplied = 0;

  if (!storage.metadata) {
    console.debug("Adding metadata node");
    storage.metadata = {
      onboarded: false,
      user: generateUUID(),
    };

    migrationsApplied++;
  }

  if (!storage.metadata.onboarded) {
    console.debug("User has not onboarded and has no onboarded indicator");
    storage.metadata.onboarded = false;
    migrationsApplied++;
  }

  if (!storage.metadata.user) {
    console.debug("Giving user a uuid");
    storage.metadata.user = generateUUID();
    migrationsApplied++;
  }

  if (!storage.metadata.errors) {
    console.debug("User does not have errors node");
    storage.metadata.errors = [];
    migrationsApplied++;
  }

  if (!storage.metadata.tracking) {
    console.debug("User does not have tracking data");
    storage.metadata.tracking = [];
    migrationsApplied++;
  }

  if (!storage.metadata.canTrack) {
    console.debug("User does not have tracking indicator");
    storage.metadata.canTrack = true;
    migrationsApplied++;
  }

  if (!storage.metadata.trackingTime) {
    console.debug("User does not have last tracking data sent");
    storage.metadata.trackingTime = Date.now();
    migrationsApplied++;
  }

  console.debug("Successfully migrated " + (migrationsApplied > 0 ? " with " + migrationsApplied + " migrations applied" : ""));
  return storage;
};

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

const shouldSendMetrics = (state) =>
  state.metadata.trackingTime && (Date.now() - state.metadata.trackingTime) / 1000 > SEND_METRICS_EVERY_SECONDS && state.metadata.tracking.length > 0;

const sendMetrics = (store) => {
  console.log("sending metrics");
  let state = store.getState();
  console.log("sending metrics to url: " + `${config.docamatic_api_url}/metrics`);
  console.log("with body");
  console.log(state.metadata.tracking);
  console.log("string ified");
  console.log(JSON.stringify(state.metadata.tracking));
  fetch(`${config.docamatic_api_url}/metrics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    mode: "cors",
    body: JSON.stringify(state.metadata.tracking),
  })
    .then((p) => {
      console.debug("successfully sent metrics");
      // clear out tracking items
      // reset timer
      store.dispatch(clearTrackingEvents());
      store.dispatch(resetTrackingTimer(Date.now()));
    })
    .catch((p) => {
      console.error("failed to send metrics");
      console.error(p);
    });
};

const handleMetrics = (store) => {
  console.log("seeing if I should send metrics");
  if (shouldSendMetrics(store.getState())) {
    console.log("sending metrics because " + SEND_METRICS_EVERY_SECONDS + " has elapsed");
    sendMetrics(store);
  } else {
    console.log("not sending metrics");
  }
};
const init = (preloadedState) => {
  const store = createStore(notesApp, preloadedState);

  handleMetrics(store);

  if (!preloadedState?.metadata?.onboarded) {
    console.log("you are not onboarded");
    chrome.runtime.onInstalled.addListener(() => {
      chrome.tabs.create({ url: "/onboarding.html" }, () => {});
    });
  } else {
    console.log("you are already onboardded");
  }
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
});

console.log("after getStateFromStorage");
