import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Store } from "react-chrome-redux";
import Popup from "./popup";

let root = document.getElementById("__POPUP__MOUNT__POINT__");

const store = new Store({
  portName: "NOTES_STORE"
});

if (!root) {
  // console.log("There is no root mount point for us :(");
  root = document.createElement("div");

  document.body.appendChild(root);
} else {
  // console.log("Yay, I found a mount point :)");
}

store.ready().then(() => {
  ReactDOM.render(
    <Provider store={store}>
      <Popup/>
    </Provider>,
    root
  );
});
