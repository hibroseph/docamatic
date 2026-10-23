// Connects Docamatic's own pages (popup, side panel, board, Backup &
// restore, welcome page) to the redux store in the background. It speaks
// webext-redux's protocol, so those pages keep using its proxy Store
// (utils/createProxyStore.js), but unlike webext-redux's wrapStore it never
// talks to web pages: webext-redux sent every change, with note contents, to
// every open tab, and answered any tab that asked for the whole state. Web
// pages get only their own notes, from pageChannel.js.
import { DISPATCH_TYPE, FETCH_STATE_TYPE, PATCH_STATE_TYPE, STATE_TYPE } from "webext-redux/lib/constants";

/** A message from one of Docamatic's own pages (not a content script in a web page) */
export const fromExtensionPage = (sender) =>
  sender?.id === chrome.runtime.id && typeof sender.url === "string" && sender.url.startsWith(chrome.runtime.getURL(""));

/**
 * Registers the message listener right away (an MV3 service worker must, or
 * it can miss the message that woke it) and returns `wrap(store)`, called
 * once the store exists; messages that came before are answered then.
 */
export const createExtensionPagesBridge = ({ channelName, diffStrategy }) => {
  let store = null;
  const waiting = [];

  const handle = (message, sender, sendResponse) => {
    if (message.type === FETCH_STATE_TYPE) {
      sendResponse({ type: FETCH_STATE_TYPE, payload: store.getState() });
      return;
    }
    let result;
    try {
      // `_sender` is what authorizeSender checks; whatever the page put there is replaced
      result = store.dispatch({ ...message.payload, _sender: sender });
    } catch (err) {
      result = Promise.reject(err);
    }
    Promise.resolve(result).then(
      (value) => sendResponse({ error: null, value }),
      (err) => sendResponse({ error: err?.message || String(err), value: null })
    );
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.channelName !== channelName) return;
    if (message.type !== FETCH_STATE_TYPE && message.type !== DISPATCH_TYPE) return;
    if (!fromExtensionPage(sender)) return;
    if (store) handle(message, sender, sendResponse);
    else waiting.push(() => handle(message, sender, sendResponse));
    return true; // answered asynchronously
  });

  // runtime.sendMessage reaches Docamatic's own pages only, never web pages
  const post = (message) => chrome.runtime.sendMessage(message).catch(() => {
    // No page of ours is open: nobody to tell
  });

  return (theStore) => {
    store = theStore;
    let current = store.getState();
    store.subscribe(() => {
      const next = store.getState();
      const diff = diffStrategy(current, next);
      if (diff.length) {
        current = next;
        post({ type: PATCH_STATE_TYPE, payload: diff, channelName });
      }
    });
    post({ type: STATE_TYPE, payload: current, channelName });
    waiting.splice(0).forEach((answer) => answer());
  };
};
