import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Store } from "webext-redux";
import Popup from "./Popup";
import ErrorBoundary from "../../components/ErrorBoundary";

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
      <ErrorBoundary>
        <Popup />
      </ErrorBoundary>
    </Provider>,
    root
  );
});
