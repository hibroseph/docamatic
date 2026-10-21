// Puts the notes layer on a page: a custom element at the top left of <body>
// with a shadow root holding the notes and their styles. Used by the notes UI
// on web pages and by the demos on the website and welcome page, so the demo
// is the real thing.
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import type { Store } from "redux";
import tokensCss from "../styles/tokens.css?inline";
import componentsCss from "../../design-system/components/bundle.css?inline";
import uiCss from "../styles/ui.css?inline";
import pageCss from "../styles/page.css?inline";
import { UndoProvider } from "../ui/undo";
import { PageNotes } from "./PageNotes";
import { deliverKeysTo } from "./keyGuard";

const STYLES = [tokensCss, componentsCss, uiCss, pageCss].join("\n");

// Some sites replace the whole <body> when navigating (GitHub's Turbo does on
// every link click), or clear the body's children, which takes the notes'
// root element with it. Put it back whenever that happens: moving the element
// keeps its shadow root and the React tree inside it intact. Only direct
// children of <html> and <body> are watched, so this costs next to nothing.
//
// It's also kept the *last* element in <body>. Notes use the highest z-index
// there is, and when a site's own element has it too (Facebook's chat
// windows and popups do), whichever comes later in the page is on top. Sites
// keep adding those to the end of <body>, which would cover the notes.
const keepAttached = (rootNode: HTMLElement) => {
  const observer = new MutationObserver(() => reattach());

  const watch = () => {
    observer.disconnect();
    observer.observe(document.documentElement, { childList: true });
    if (document.body) observer.observe(document.body, { childList: true });
  };

  // Moving the layer would take the cursor out of a note being typed in, or
  // drop a note being dragged, so it waits for those to finish
  let pointerDown = false;
  rootNode.addEventListener("pointerdown", () => (pointerDown = true));
  window.addEventListener("pointerup", () => {
    pointerDown = false;
    reattach();
  });
  window.addEventListener("pointercancel", () => (pointerDown = false));
  rootNode.addEventListener("focusout", () => setTimeout(reattach));
  const busy = () => pointerDown || document.activeElement === rootNode;

  // Another script (or extension) doing the same would make the two take
  // turns forever; after many moves in a short time, stop for a while
  let moves: number[] = [];
  let pausedUntil = 0;

  const reattach = () => {
    const body = document.body;
    if (body) {
      if (!rootNode.isConnected) {
        body.appendChild(rootNode);
      } else if (body.lastElementChild !== rootNode && rootNode.parentNode === body && !busy() && Date.now() > pausedUntil) {
        const now = Date.now();
        moves = moves.filter((at) => now - at < 10_000);
        moves.push(now);
        if (moves.length > 20) pausedUntil = now + 60_000;
        else body.appendChild(rootNode);
      }
    }
    // The body may be a new element now, so watch that one
    watch();
  };

  watch();
};

/**
 * Constructed stylesheets aren't affected by a site's Content Security
 * Policy for inline styles. Firefox doesn't let content scripts hand their
 * own stylesheet objects to the page's DOM, so a <style> element is the
 * fallback there.
 */
const addStyles = (shadow: ShadowRoot) => {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLES);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);
  }
};

interface MountOptions {
  store: Store;
  /** The id of the root element; an existing one is replaced */
  id: string;
  /** "closed" on web pages, so the site's scripts can't read the notes */
  mode?: ShadowRootMode;
  /** Called with a function to call if the extension is reloaded under this page */
  onDisconnectReady?: (markDisconnected: () => void) => void;
  saveTitles?: boolean;
}

const Layer = ({ onDisconnectReady, saveTitles }: Pick<MountOptions, "onDisconnectReady" | "saveTitles">) => {
  const [disconnected, setDisconnected] = useState(false);
  useEffect(() => onDisconnectReady?.(() => setDisconnected(true)), []);
  return (
    <UndoProvider className="toast-region--page">
      <PageNotes disconnected={disconnected} saveTitles={saveTitles} />
    </UndoProvider>
  );
};

export const mountNotes = ({ store, id, mode = "closed", onDisconnectReady, saveTitles = true }: MountOptions) => {
  // A mount point left by an earlier copy of this script (e.g. before the
  // extension was reloaded) can't be reused: its shadow root is closed.
  document.getElementById(id)?.remove();

  // A custom element rather than a <div>, so the page's generic rules
  // (div { ... }, body > div { display: none }, ...) don't match it. It sits
  // outside the shadow root, so page CSS can still target it directly; the
  // inline styles below win over anything that isn't !important.
  const rootNode = document.createElement("docamatic-notes");
  // Reset everything first, including inherited properties like font,
  // color and line-height, then set what the notes need
  rootNode.style.all = "initial";
  Object.assign(rootNode.style, {
    display: "block",
    top: "0",
    left: "0",
    position: "absolute",
    // The maximum z-index browsers accept; anything larger is ignored
    zIndex: "2147483647",
  });
  rootNode.id = id;
  document.body.appendChild(rootNode);
  keepAttached(rootNode);

  // Closed so the page's own scripts can't reach the notes through
  // element.shadowRoot. Otherwise analytics/session-replay tools on the site
  // (Hotjar, FullStory, ...) would record what people write in their notes.
  const shadow = rootNode.attachShadow({ mode });
  addStyles(shadow);
  // Keys typed in a note reach the note, never the site's shortcuts
  deliverKeysTo(shadow);

  // Notes are paper on every site, whatever the system theme
  const container = document.createElement("div");
  container.className = "page-layer";
  container.dataset.theme = "light";
  shadow.appendChild(container);

  createRoot(container).render(
    <Provider store={store}>
      <Layer onDisconnectReady={onDisconnectReady} saveTitles={saveTitles} />
    </Provider>
  );
  return rootNode;
};
