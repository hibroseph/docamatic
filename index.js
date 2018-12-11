import React from "react";
import ReactDOM from "react-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import notesApp from "./src/redux/reducer";
import App from "./src/components/App";
import { Store } from "react-chrome-redux";
import { changeConfirmLocale } from "antd/lib/modal/locale";

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

// console.log("Inital state: ")
// console.log(store.getState())

console.log("Notes storage key: " + notesStorageKey);

const store = new Store({
  portName: "NOTES_STORE"
});

store.subscribe(() => {
  console.log("Store Update");
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
  //   console.log(store.getState());
  //   console.log(document.documentElement.scrollTop);
});

// This is used to communicate with the chrome extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // This is if the extension is requesting the current scroll position to position the new note
  if (request.newNote == "") {
    sendResponse({
      scrollPosition: document.documentElement.scrollTop,
      page: window.location.href
    });
  }
});

store.ready().then(() => {
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

  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    rootNode
  );
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.unregister();
