import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Store } from "webext-redux";
import Popup from "./Popup";
import ErrorBoundary from "../../components/ErrorBoundary";
import config from "../../../config.json"
import * as Sentry from "@sentry/react";

console.debug("initalizing sentry")
// Initializing Sentry
Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: config.environment,
  release: config.release_prefix + config.version,
});

console.debug("connecting from popup")
// initalize connection from popup
chrome.runtime.connect({ name: "POPUP" });

const initPopup = () => {
  console.log("initing popup")
  let root = document.getElementById("__POPUP__MOUNT__POINT__");

  console.debug("creating store")
  const store = new Store({
    portName: "NOTES_STORE",
  });

  console.debug("appending children")
  if (!root) {
    root = document.createElement("div");
    document.body.appendChild(root);
  }
  console.debug("waiting for store")
  store.ready().then(() => {
    console.debug("store ready. here is the store")
    console.debug(store)
    ReactDOM.render(
      <Provider store={store}>
        <ErrorBoundary>
          <Popup />
        </ErrorBoundary>
      </Provider>,
      root
    );
  });
}


// Listens for when the store gets initialized
chrome.runtime.onMessage.addListener((req) => {
  if (req.type === "STORE_INITIALIZED") {
    // Initializes the popup logic
    initPopup();
  }
});
