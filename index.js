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
//     const serialized = JSON.stringify(store.getState());
//     localStorage.setItem(notesStorageKey, serialized)
//     console.log(store.getState())
// })

// console.log("Inital state: ")
// console.log(store.getState())
const store = new Store({
  portName: "NOTES_STORE"
});

store.subscribe(() => {
  console.log("subscribe listener!");
  const serialized = JSON.stringify(store.getState());
  localStorage.setItem(notesStorageKey, serialized);
  console.log(store.getState());
  console.log(document.documentElement.scrollTop);
});

console.log("INDEX.JS");
console.log(window);

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   console.log("We recieved a message from: " + request + " SENDER: " + sender);
//   console.log("scrollTop: " + document.documentElement.scrollTop);

//   console.log("sending response");
//   sendResponse({ ScrollY: document.documentElement.scrollTop });
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("We got a request from:");
  console.log(sender);
  console.log("containing: ");
  console.log(request);

  if (request.scrollPosition == "currentScrollPosition") {
    console.log("The scrollPosition is being requested!")

    console.log(
      "We are going to send: " + document.documentElement.scrollTop + " back!"
    );
    sendResponse({ scrollPosition: document.documentElement.scrollTop });
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
