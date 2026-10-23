// The notes UI on web pages talks to the background through this, and gets
// only that page's notes (pageViews.js), never the whole state.
//
//   PAGE_STATE_REQUEST: the page asks for its view (on start, after a single
//     page app changes address, after coming back from the back/forward
//     cache). Decided from the address the browser reports for the tab, not
//     anything in the message, so a page can't ask for another site's notes.
//   PAGE_DISPATCH: a change from the page's notes UI. authorizeSender limits
//     it to the page's own site.
//   PAGE_STATE_PUSH: the background sends a tab its new view when notes it
//     shows change (from the popup, another tab, an import...).
import { CHROME_MESSAGES } from "../utils/constants";
import { changedPages, pageViewFor, showsAnyOf } from "./pageViews";

// Changes in quick succession (typing) go out together
const PUSH_DELAY_MS = 40;

const isWebPage = (url) => typeof url === "string" && /^(https?|file):/.test(url);

/**
 * Registers the listeners right away (see extensionPagesBridge.js) and
 * returns `connect(store)`, called once the store exists.
 */
export const createPageChannel = () => {
  let store = null;
  const waiting = [];

  const handle = (message, sender, sendResponse) => {
    if (message.type === CHROME_MESSAGES.PAGE_STATE_REQUEST) {
      sendResponse({ view: pageViewFor(store.getState(), sender.url) });
      return;
    }
    // PAGE_DISPATCH: only actions, never a sender the page made up
    const action = message.action && typeof message.action === "object" ? { ...message.action } : null;
    if (!action || typeof action.type !== "string") {
      sendResponse({ error: "Not an action", value: null });
      return;
    }
    delete action._sender;
    let result;
    try {
      result = store.dispatch({ ...action, _sender: sender });
    } catch (err) {
      result = Promise.reject(err);
    }
    Promise.resolve(result).then(
      // Nothing of the state goes back: the page gets its new view as a push
      () => sendResponse({ error: null, value: null }),
      (err) => sendResponse({ error: err?.message || String(err), value: null })
    );
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== CHROME_MESSAGES.PAGE_STATE_REQUEST && message?.type !== CHROME_MESSAGES.PAGE_DISPATCH) return;
    // Only Docamatic's content script, in a tab's web page
    if (sender.id !== chrome.runtime.id || !sender.tab || !isWebPage(sender.url)) return;
    if (store) handle(message, sender, sendResponse);
    else waiting.push(() => handle(message, sender, sendResponse));
    return true; // answered asynchronously
  });

  return (theStore) => {
    store = theStore;
    let sent = store.getState();
    let timer = null;

    const push = async () => {
      timer = null;
      const next = store.getState();
      const { all, keys } = changedPages(sent, next);
      sent = next;
      if (!all && keys.size === 0) return;
      const tabs = await chrome.tabs.query({}).catch(() => []);
      for (const tab of tabs) {
        if (tab.id === undefined || !isWebPage(tab.url) || tab.discarded) continue;
        if (!all && !showsAnyOf(tab.url, keys)) continue;
        // Pages without the notes UI ignore it (or have no listener at all)
        chrome.tabs
          .sendMessage(tab.id, { type: CHROME_MESSAGES.PAGE_STATE_PUSH, view: pageViewFor(next, tab.url) }, { frameId: 0 })
          .catch(() => {});
      }
    };

    store.subscribe(() => {
      if (!timer) timer = setTimeout(push, PUSH_DELAY_MS);
    });
    waiting.splice(0).forEach((answer) => answer());
  };
};
