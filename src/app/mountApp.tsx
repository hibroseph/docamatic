import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "../styles/fonts.css";
import "../styles/tokens.css";
import "../../design-system/components/bundle.css";
import "../styles/ui.css";
import "../styles/app.css";
import { initSentry } from "../utils/sentry";
import { createProxyStore } from "../utils/createProxyStore";
import { trackEvent } from "../redux/actions";
import { NoRenderErrorBoundary } from "../ui/NoRenderErrorBoundary";
import { App } from "./App";
import { applyTheme, type Surface } from "./hooks";
import type { State } from "../model/types";

export const mountApp = (surface: Surface) => {
  initSentry(surface);
  const store = createProxyStore();

  store.ready().then(() => {
    // Before the first paint, so a dark theme doesn't flash light
    applyTheme((store.getState() as State).metadata?.preferences?.theme || "system");
    store.dispatch(trackEvent(surface === "popup" ? "popup_opened" : "sidepanel_opened"));
    createRoot(document.getElementById("root")!).render(
      <Provider store={store}>
        <NoRenderErrorBoundary>
          <App surface={surface} />
        </NoRenderErrorBoundary>
      </Provider>
    );
  });
};
