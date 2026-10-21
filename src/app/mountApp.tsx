import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "../styles/fonts.css";
import "../styles/tokens.css";
import "../../design-system/components/bundle.css";
import "../styles/ui.css";
import "../styles/app.css";
import { captureException, initSentry } from "../utils/sentry";
import { createProxyStore } from "../utils/createProxyStore";
import { trackEvent } from "../redux/actions";
import { App } from "./App";
import { applyTheme, type Surface } from "./hooks";
import type { State } from "../model/types";

// The old popup could stay white: when anything failed, or the background
// didn't answer, there was nothing to show (16 uninstalls said so). Now
// there's always something: "Starting…", then a way out if it takes too long,
// and a message instead of a blank page if something breaks.
const SLOW_START_MS = 4000;

const Message = ({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) => (
  <div className="shell">
    <div className="startup" role="status">
      <h1 className="view-title">{title}</h1>
      <p>{text}</p>
      {children}
    </div>
  </div>
);

const Buttons = () => (
  <div className="settings__buttons">
    <button type="button" className="dm-btn dm-btn--primary" onClick={() => location.reload()}>
      Try again
    </button>
    <button type="button" className="dm-btn" onClick={() => chrome.runtime.reload()}>
      Restart Docamatic
    </button>
  </div>
);

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: React.ErrorInfo) {
    captureException(error, { componentStack: info?.componentStack });
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Message
        title="Something went wrong"
        text="Docamatic couldn't show this. Your notes are safe. It's been reported, and trying again usually fixes it."
      >
        <Buttons />
      </Message>
    );
  }
}

export const mountApp = (surface: Surface) => {
  initSentry(surface);
  const root = createRoot(document.getElementById("root")!);
  root.render(<Message title="Docamatic" text="Opening your notes…" />);

  const store = createProxyStore();
  let ready = false;
  const slow = setTimeout(() => {
    if (ready) return;
    root.render(
      <Message
        title="Docamatic is taking a while"
        text="It usually starts in a moment. If it doesn't, try again, or restart Docamatic. Your notes are saved either way."
      >
        <Buttons />
      </Message>
    );
  }, SLOW_START_MS);

  store.ready().then(() => {
    ready = true;
    clearTimeout(slow);
    // Before the first paint, so a dark theme doesn't flash light
    applyTheme((store.getState() as State).metadata?.preferences?.theme || "system");
    store.dispatch(trackEvent(surface === "popup" ? "popup_opened" : "sidepanel_opened"));
    root.render(
      <Provider store={store}>
        <AppErrorBoundary>
          <App surface={surface} />
        </AppErrorBoundary>
      </Provider>
    );
  });
};
