import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Store } from "react-chrome-redux";
import "fontsource-roboto"
import Popup from "./Popup";

let root = document.getElementById("__POPUP__MOUNT__POINT__");

const store = new Store({
  portName: "NOTES_STORE"
});

if (!root) {
  root = document.createElement("div");

  document.body.appendChild(root);
}

store.ready().then(() => {
  ReactDOM.render(
    <Provider store={store}>
      <Popup />
    </Provider>,
    root
  );
});
