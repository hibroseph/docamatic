import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "./components/App";
import { Store } from "react-chrome-redux";

const notesStorageKey = `notes-${window.location.href}`;

// // See if we have previously saved a state and if not, insert an empty array
// let initialState = JSON.parse(localStorage.getItem(notesStorageKey) || '{"notes" : []}')

// // This is used to reset the state if something is saved as undefined
// // initialState = {notes:[]}

// // Create the store
// const store = createStore(notesApp, initialState)

// store.subscribe(() => {
// //     const serialized = JSON.stringify(store.getState());
// //     localStorage.setItem(notesStorageKey, serialized)
// //     console.log(store.getState())
// })

// Send a message giving the current browser width and height so that notes will not appear out of that area
chrome.runtime.sendMessage({
  message: "windowSize",
  pageWidth: document.documentElement.clientWidth,
  pageHeight: document.documentElement.clientHeight
});

const store = new Store({
  portName: "NOTES_STORE"
});

store.subscribe(() => {
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
});

// This is used to communicate with the chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // This is if the extension is requesting the current scroll position to position the new note
  if (request.newNote == "") {
    sendResponse({
      scrollPosition: document.documentElement.scrollTop,
      page: window.location.href,
      pageWidth: document.documentElement.clientWidth,
      pageHeight: document.documentElement.clientHeight
    });
  }
});

let rootNode = document.getElementById("__NOTES___MOUNT___POINT___");

if (!rootNode) {
  rootNode = document.createElement("div");
  Object.assign(rootNode.style, {
    top: 0,
    left: 0,
    position: "absolute",
    zIndex: 9999999999999999
  });
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
