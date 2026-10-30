// The content script that runs on every page. It is deliberately tiny (no
// React, no Sentry, no dependencies): the full notes UI is ~400KB, and almost
// no page a person visits has notes on it. Instead of parsing all of that on
// every page, this asks the background whether the current page has notes and
// only then has it inject the UI (apps/script/notes-ui.js).
import { defineContentScript } from "wxt/utils/define-content-script";
import { CHROME_MESSAGES } from "../utils/constants";
import { installKeyGuard } from "../page/keyGuard";

declare global {
  interface Window {
    __DOCAMATIC_LOADER__?: boolean;
    navigation?: EventTarget;
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  // Before the page's own scripts, so the key guard's listener is first
  // (page/keyGuard.ts). Everything else waits for the page below.
  runAt: "document_start",
  main() {
    installKeyGuard();
    startLoader();
  },
});

function startLoader() {

// The popup re-injects this script into tabs that were open before the
// extension was installed/updated, so it can run twice in the same page
if (!window.__DOCAMATIC_LOADER__) {
  window.__DOCAMATIC_LOADER__ = true;

  let uiMounted = false;
  let lastUrl: string | null = null;

  // Asks the background to inject the notes UI into this tab if this page
  // has notes. (When a page gets its first note, the background injects the
  // UI into open tabs itself.)
  // The background may still be starting when the page asks (browser
  // startup, just after an update: newer Chrome versions take longer), and
  // then the question is lost. Ask again a few times before giving up.
  const RETRY_MS = [300, 1000, 3000, 6000];

  const requestNotesUi = async (attempt = 0): Promise<void> => {
    if (uiMounted) return;
    const askedFor = location.href;
    let answered = false;
    try {
      const response = await chrome.runtime.sendMessage({ type: CHROME_MESSAGES.MOUNT_NOTES_UI });
      answered = response !== undefined;
      if (response?.mounted) {
        uiMounted = true;
        // From here on the UI tracks url changes itself
        stopWatchingUrl();
      }
    } catch {
      // Below: retried unless this copy of the script is orphaned
    }
    // Orphaned (the extension was reloaded or updated): this copy can't reach
    // it any more; the new one is injected into open tabs by the background
    if (answered || !chrome.runtime?.id || attempt >= RETRY_MS.length) return;
    setTimeout(() => {
      // Only for the page it asked about (a single page app may have moved on)
      if (location.href === askedFor) requestNotesUi(attempt + 1);
    }, RETRY_MS[attempt]);
  };

  // Single page apps (x.com, YouTube, ...) change the url without loading a
  // new page, so a page with notes can be navigated to at any time
  const checkUrl = () => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    requestNotesUi();
  };
  const checkUrlAfterClick = () => requestAnimationFrame(checkUrl);

  const stopWatchingUrl = () => {
    window.navigation?.removeEventListener("navigatesuccess", checkUrl);
    window.removeEventListener("popstate", checkUrl);
    document.removeEventListener("click", checkUrlAfterClick, true);
  };

  window.navigation?.addEventListener("navigatesuccess", checkUrl);
  window.addEventListener("popstate", checkUrl);
  document.addEventListener("click", checkUrlAfterClick, true);

  // Where the page was last right-clicked, for "Add a note here" in the
  // right-click menu. Page coordinates, so scrolling since doesn't matter.
  let lastContextMenu: { x: number; y: number } | null = null;
  document.addEventListener(
    "contextmenu",
    (event) => {
      lastContextMenu = { x: event.pageX, y: event.pageY };
    },
    true
  );

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Where to place a new note on this page
    if (request.action === CHROME_MESSAGES.GET_PAGE_INFORMATION) {
      sendResponse({
        scrollPosition: document.documentElement.scrollTop,
        scrollLeft: document.documentElement.scrollLeft,
        page: window.location.href,
        pageWidth: document.documentElement.clientWidth,
        pageHeight: document.documentElement.clientHeight,
        contextMenuAt: lastContextMenu,
      });
    }
  });

  // document.body is missing on non-HTML documents such as raw XML or SVG
  const start = () => {
    if (document.body) checkUrl();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
}
