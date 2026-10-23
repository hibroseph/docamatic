// The board: all notes on one page, grouped by tag (board/Board.tsx).
// Opened from the popup.
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "../../../design-system/components/bundle.css";
import "../../styles/ui.css";
import "../../styles/app.css";
import "../../styles/board.css";
import { initSentry } from "../../utils/sentry";
import { createProxyStore } from "../../utils/createProxyStore";
import { applyTheme } from "../../app/hooks";
import { Board } from "../../board/Board";
import type { State } from "../../model/types";

initSentry("board");

const store = createProxyStore();
store.ready().then(() => {
  // Before the first paint, so a dark theme doesn't flash light
  applyTheme((store.getState() as State).metadata?.preferences?.theme || "system");
  createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
      <Board />
    </Provider>
  );
});
