// The notes UI shown on web pages. Injected by the background only into pages
// that have notes (see loader.js, the content script that runs everywhere).
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "../../components/App";
import config from "../../../config.json";
import { StyleSheetManager } from 'styled-components';
import { config as fontAwesomeConfig, dom as fontAwesomeDom } from "@fortawesome/fontawesome-svg-core";
import { initSentry } from "../../utils/sentry";
import { createProxyStore } from "../../utils/createProxyStore";
import { CHROME_MESSAGES } from "../../utils/constants";
import { notifyUrlChange } from "../../utils/urlChanges";

// Font Awesome normally adds its stylesheet to document.head. Here that is
// the host page's head: it would add global .fa-* rules to every site (and
// clash with sites using their own Font Awesome), while not reaching our icons
// inside the shadow root at all. Its CSS is added to the shadow root instead.
fontAwesomeConfig.autoAddCss = false;

// Some sites replace the whole <body> when navigating (GitHub's Turbo does on
// every link click), or clear the body's children, which takes the notes'
// root element with it. Put it back whenever that happens: moving the element
// keeps its shadow root and the React tree inside it intact. Only direct
// children of <html> and <body> are watched, so this costs next to nothing.
const keepAttached = (rootNode) => {
  const observer = new MutationObserver(() => reattach());

  const watch = () => {
    observer.disconnect();
    observer.observe(document.documentElement, { childList: true });
    if (document.body) observer.observe(document.body, { childList: true });
  };

  const reattach = () => {
    if (!rootNode.isConnected && document.body) {
      document.body.appendChild(rootNode);
    }
    // The body may be a new element now, so watch that one
    watch();
  };

  watch();
};

// Guard against being injected twice into the same page (e.g. the loader
// asking again while the first injection is still loading). Scripts injected
// by this extension share this window object.
const alreadyLoaded = window.__DOCAMATIC_LOADED__;
window.__DOCAMATIC_LOADED__ = true;

const initPageScript = () => {
  initSentry("content_script");

  // In MV3 the background service worker can be shut down and restarted at
  // any time; webext-redux handles that by sending each dispatch as a one-off
  // message. The one case we can't recover from is the extension itself being
  // reloaded or updated: this content script is then orphaned, so let the UI
  // know the page needs a refresh.
  const store = createProxyStore(() => document.dispatchEvent(new CustomEvent('docamatic-disconnect')));

  // Pages kept in Chrome's back/forward cache, or frozen in the background,
  // don't receive state updates while they're away. Fetch the whole state
  // again when they come back, so they don't keep showing outdated notes.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) store.resync();
  });
  document.addEventListener("resume", () => store.resync());

  // The background tells us when a single page app changes the url
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.action === CHROME_MESSAGES.URL_CHANGED) notifyUrlChange();
  });

  const MOUNT_POINT_PREFIX = "_DOCAMATIC_NOTES_MOUNT_POINT:";
  const PAGE_MOUNT_POINT = MOUNT_POINT_PREFIX + config.version + "_";
  AttachRootNodeAndRender();

  function AttachRootNodeAndRender() {
    // Notes left by an earlier copy of this script (the extension was updated
    // or reloaded while the page was open) can't be reused: their shadow root
    // is closed, and they can no longer save. Hide them rather than remove
    // them: the old copy is still running and would put a removed one back
    // (keepAttached). Any version's: older ids have their version in them.
    document.querySelectorAll(`docamatic-notes[id^="${MOUNT_POINT_PREFIX}"]`).forEach((stale) => {
      stale.id = `${stale.id}stale`;
      stale.style.setProperty("display", "none", "important");
    });

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
      top: 0,
      left: 0,
      position: "absolute",
      // The maximum z-index browsers accept; anything larger is ignored
      zIndex: 2147483647
    });
    rootNode.id = PAGE_MOUNT_POINT;
    document.body.appendChild(rootNode);
    keepAttached(rootNode);

    // "closed" so the page's own scripts can't reach the notes through
    // element.shadowRoot. Otherwise analytics/session-replay tools on the site
    // (Hotjar, FullStory, ...) would record what people write in their notes.
    const shadow = rootNode.attachShadow({mode: 'closed'});

    const fontAwesomeStyles = document.createElement("style");
    fontAwesomeStyles.textContent = fontAwesomeDom.css();
    shadow.appendChild(fontAwesomeStyles);

    const styleSlot = document.createElement('section');
    styleSlot.id = "__DOCAMATIC_STYLE_SLOT__";
    Object.assign(styleSlot.style, {
      all: "initial"
    })
    shadow.appendChild(styleSlot)

    const renderIn = document.createElement('div');
    renderIn.id = "__DOCAMATIC_RENDER_IN__"
    styleSlot.appendChild(renderIn)

    store.ready().then(() => {
      ReactDOM.render(
        <Provider store={store}>
          <StyleSheetManager target={styleSlot}>
            <App/>
          </StyleSheetManager>
        </Provider>,
        renderIn
      );
  });
  }
}

// document.body is missing on non-HTML documents such as raw XML or SVG
if (!alreadyLoaded && document.body) {
  initPageScript();
}
