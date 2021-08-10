import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "./components/App";
import { Store } from "react-chrome-redux";
import { CHROME_MESSAGES } from "./utils/constants";

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

store.subscribe(() => {
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
});

// This is used to communicate with the chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("sending data about window location");
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
  let rootNode = document.getElementById("__NOTES___MOUNT___POINT___");
  if (!rootNode) {
    rootNode = document.createElement("div");
    Object.assign(rootNode.style, {
      top: 0,
      left: 0,
      position: "absolute",
      zIndex: 9999999999999999,
    });

    rootNode.id = "__NOTES___MOUNT___POINT___";
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
