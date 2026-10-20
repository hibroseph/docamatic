// The notes UI shown on web pages. Injected by the background only into pages
// that have notes (see content.ts, the small loader that runs everywhere).
import { defineUnlistedScript } from "wxt/utils/define-unlisted-script";
import config from "../../config.json";
import { initSentry } from "../utils/sentry";
import { createProxyStore } from "../utils/createProxyStore";
import { CHROME_MESSAGES } from "../utils/constants";
import { notifyUrlChange } from "../utils/urlChanges";
import { mountNotes } from "../page/mountNotes";
import { loadPageFonts } from "../page/pageFonts";

declare global {
  interface Window {
    __DOCAMATIC_LOADED__?: boolean;
  }
}

export default defineUnlistedScript(() => {
  // Guard against being injected twice into the same page (e.g. the loader
  // asking again while the first injection is still loading). Scripts injected
  // by this extension share this window object.
  const alreadyLoaded = window.__DOCAMATIC_LOADED__;
  window.__DOCAMATIC_LOADED__ = true;

  // document.body is missing on non-HTML documents such as raw XML or SVG
  if (!alreadyLoaded && document.body) start();
});

function start() {
  initSentry("content_script");

  // In MV3 the background service worker can be shut down and restarted at
  // any time; webext-redux handles that by sending each dispatch as a one-off
  // message. The one case we can't recover from is the extension itself being
  // reloaded or updated: this content script is then orphaned, so the notes
  // say the page needs a refresh.
  let markDisconnected = () => {};
  const store = createProxyStore(() => markDisconnected()) as ReturnType<typeof createProxyStore> & {
    resync: () => Promise<void>;
  };

  // Pages kept in the back/forward cache, or frozen in the background,
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

  loadPageFonts();

  store.ready().then(() => {
    mountNotes({
      store,
      id: "_DOCAMATIC_NOTES_MOUNT_POINT:" + config.version + "_",
      onDisconnectReady: (mark) => (markDisconnected = mark),
    });
  });
}
