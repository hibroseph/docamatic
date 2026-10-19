import React from "react";
import ReactDOM from "react-dom";
import Popup from "./Popup";
import { NoRenderErrorBoundary } from "../../components/NoRenderErrorBoundary";
import { Provider } from "react-redux";
import { initSentry } from "../../utils/sentry";
import { createProxyStore } from "../../utils/createProxyStore";
import { trackEvent } from "../../redux/actions";

initSentry("popup");

const initPopup = () => {
  let root = document.getElementById("__POPUP__MOUNT__POINT__");
  const store = createProxyStore();

  if (!root) {
    root = document.createElement("div");
    document.body.appendChild(root);
  }
  store.ready().then(() => {
    store.dispatch(trackEvent("popup_opened"));
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

initPopup();
