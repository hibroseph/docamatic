// The content script that runs on every page. It is deliberately tiny (no
// React, no Sentry, no dependencies): the full notes UI is ~400KB, and almost
// no page a person visits has notes on it. Instead of parsing all of that on
// every page, this asks the background whether the current page has notes and
// only then has it inject the UI (apps/script/notes-ui.js).
import { CHROME_MESSAGES } from "../../utils/constants";

// The popup re-injects this script into tabs that were open before the
// extension was installed/updated, so it can run twice in the same page
if (!window.__DOCAMATIC_LOADER__) {
  window.__DOCAMATIC_LOADER__ = true;

  let uiMounted = false;
  let lastUrl = null;

  // Asks the background to inject the notes UI into this tab. With
  // onlyIfPageHasNotes it only does so when this page has notes.
  const requestNotesUi = async (onlyIfPageHasNotes) => {
    if (uiMounted) return;
    try {
      const response = await chrome.runtime.sendMessage({ type: CHROME_MESSAGES.MOUNT_NOTES_UI, onlyIfPageHasNotes });
      if (response?.mounted) {
        uiMounted = true;
        // From here on the UI tracks url changes itself
        stopWatchingUrl();
      }
    } catch {
      // The extension was reloaded or updated; this copy of the script is
      // orphaned. The page needs a reload to get the new one.
    }
  };

  // Single page apps (x.com, YouTube, ...) change the url without loading a
  // new page, so a page with notes can be navigated to at any time
  const checkUrl = () => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    requestNotesUi(true);
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

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Where to place a new note on this page
    if (request.action === CHROME_MESSAGES.GET_PAGE_INFORMATION) {
      sendResponse({
        scrollPosition: document.documentElement.scrollTop,
        page: window.location.href,
        pageWidth: document.documentElement.clientWidth,
        pageHeight: document.documentElement.clientHeight,
      });
    }

    // A note was just created on this page from the popup
    if (request.action === CHROME_MESSAGES.SHOW_NOTES) {
      requestNotesUi(false).then(() => sendResponse({}));
      return true; // responding asynchronously
    }
  });

  // document.body is missing on non-HTML documents such as raw XML or SVG
  if (document.body) {
    checkUrl();
  }
}
