import React from "react";
import ReactDOM from "react-dom";
import notesApp from "../redux/reducer";
import { createStore } from "redux";
import { Provider } from "react-redux";
import NewNote from "../components/NewNote";
import { Store } from "react-chrome-redux";
import Popup from "./popup";
import Button from 'react-bootstrap/lib/Button';

let root = document.getElementById("__POPUP__MOUNT__POINT__");

const store = new Store({
  portName: "NOTES_STORE"
});

if (!root) {
  console.log("There is no root mount point for us :(");
  root = document.createElement("div");

  document.body.appendChild(root);
} else {
  console.log("Yay, I found a mount point :)");
}

store.ready().then(() => {
  ReactDOM.render(
    <Provider store={store}>
      <Popup></Popup>
    </Provider>,
    root
  );
});
