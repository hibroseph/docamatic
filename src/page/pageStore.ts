// The notes UI's store on a web page: holds only this page's notes (see
// background/pageChannel.js), never the whole state. It has the shape
// react-redux and the notes UI need (getState, subscribe, dispatch), plus
// ready() and resync() like the proxy store Docamatic's own pages use.
//
// Changes are dispatched to the background, which sends the page its new view
// when it has applied them (also when they come from elsewhere: the popup,
// another tab).
import { CHROME_MESSAGES } from "../utils/constants";
import { trackDispatches } from "../utils/reporting";
import { onUrlChange } from "../utils/urlChanges";
import type { Store } from "redux";
import type { State } from "../model/types";

type Action = { type: string; [key: string]: unknown };
type Listener = () => void;

const EMPTY: State = { pages: {}, tags: [], metadata: {} } as unknown as State;

export const createPageStore = (onDisconnect: () => void) => {
  let state: State = EMPTY;
  const listeners = new Set<Listener>();
  let resolveReady: () => void = () => {};
  const readyPromise = new Promise<void>((resolve) => (resolveReady = resolve));

  const set = (view: State) => {
    state = view;
    listeners.forEach((listener) => listener());
  };

  // The page's view, for the address it's at now
  const resync = (): Promise<void> =>
    chrome.runtime
      .sendMessage({ type: CHROME_MESSAGES.PAGE_STATE_REQUEST })
      .then((reply) => {
        if (reply?.view) {
          set(reply.view);
          resolveReady();
        }
      })
      .catch(() => {
        // Orphaned (the extension was updated): the notes say so
        if (!chrome.runtime?.id) onDisconnect();
      });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === CHROME_MESSAGES.PAGE_STATE_PUSH && message.view) set(message.view);
  });

  // A single page app moved to another address: its notes are different
  let lastUrl = location.href;
  const checkUrl = () => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    resync();
  };
  onUrlChange(checkUrl);
  window.addEventListener("popstate", checkUrl);
  (window as unknown as { navigation?: EventTarget }).navigation?.addEventListener("navigatesuccess", checkUrl);
  document.addEventListener("click", () => requestAnimationFrame(checkUrl), true);

  const send = (action: Action): Promise<unknown> =>
    chrome.runtime.sendMessage({ type: CHROME_MESSAGES.PAGE_DISPATCH, action }).then((reply) => {
      if (!reply) throw new Error("error in the background page: no answer");
      // Same wording as the proxy store's, which trackDispatches knows not to report twice
      if (reply.error) throw new Error(`error in the background page: ${reply.error}`);
      return reply.value;
    });

  const store = {
    getState: () => state,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch: (action: Action) => dispatch(action),
    replaceReducer: () => {},
    ready: () => readyPromise,
    resync,
  };
  // Breadcrumbs, errors, and noticing the extension went away (utils/sentry.js)
  const dispatch = trackDispatches(onDisconnect)()(send) as (action: Action) => Promise<unknown>;

  resync();
  // react-redux only uses getState, subscribe and dispatch
  return store as unknown as Store<State> & { ready: () => Promise<void>; resync: () => Promise<void> };
};
