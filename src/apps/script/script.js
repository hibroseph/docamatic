import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "../../components/App";
import { Store } from "webext-redux";
import { CHROME_MESSAGES } from "../../utils/constants";
import config from "../../../config.json";
import * as Sentry from "@sentry/react";
import config from "../../config.json";

// Initializing Sentry
Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: config.environment,
  release: config.release_prefix + config.version,
  ignoreErrors: ["ResizeObserver loop limit exceeded"],
});

const notesStorageKey = `notes-${window.location.href}`;

// Send a message giving the current browser width and height so that notes will not appear out of that area
chrome.runtime.sendMessage({
  message: "windowSize",
  pageWidth: document.documentElement.clientWidth,
  pageHeight: document.documentElement.clientHeight,
});

const store = new Store({
  portName: "NOTES_STORE",
});

const PAGE_MOUNT_POINT = "_DOCAMATIC_NOTES_MOUNT_POINT:" + config.version + "_";

store.subscribe(() => {
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
});

// This is used to communicate with the chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // This is if the extension is requesting the current scroll position to position the new note
  if (request.action == CHROME_MESSAGES.GET_PAGE_INFORMATION) {
    sendResponse({
      scrollPosition: document.documentElement.scrollTop,
      page: window.location.href,
      pageWidth: document.documentElement.clientWidth,
      pageHeight: document.documentElement.clientHeight,
    });
  }
});

AttachRootNodeAndRender();

function AttachRootNodeAndRender() {
  let rootNode = document.getElementById(PAGE_MOUNT_POINT);
  if (!rootNode) {
    rootNode = document.createElement("div");
    Object.assign(rootNode.style, {
      top: 0,
      left: 0,
      position: "absolute",
      zIndex: 9999999999999999,
    });

    rootNode.id = PAGE_MOUNT_POINT;
    document.body.appendChild(rootNode);
  }

  store.ready().then(() => {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      rootNode
    );
  });
}
