import React from "react";
import ReactDOM from "react-dom";
import Popup from "./Popup";
import config from "../../../config.json"
import * as Sentry from "@sentry/react";
import { RewriteFrames as RewriteFramesIntegration } from "@sentry/integrations";
import { NoRenderErrorBoundary } from "../../components/NoRenderErrorBoundary";
import { Provider } from "react-redux";
import { Store } from "webext-redux";

// Initializing Sentry
Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: config.environment,
  release: config.release_prefix + config.version,
  integrations: [new RewriteFramesIntegration(
    {
      // root path that will be stripped from the current frame's filename by the default iteratee if the filename is an absolute path
      root: "chrome-extension://",

      // a custom prefix that will be used by the default iteratee (default: `app://`)
      prefix: "",

      // function that takes the frame, applies a transformation, and returns it
      iteratee: (frame) => frame
    }
  )],
});

// initalize connection from popup
chrome.runtime.connect({ name: "POPUP" });

const initPopup = () => {
  let root = document.getElementById("__POPUP__MOUNT__POINT__");
  const store = new Store({
    portName: "NOTES_STORE",
  });

  if (!root) {
    root = document.createElement("div");
    document.body.appendChild(root);
  }
  store.ready().then(() => {
    ReactDOM.render(
      <Provider store={store}>
        <NoRenderErrorBoundary>
          <Popup />
          </NoRenderErrorBoundary>
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
