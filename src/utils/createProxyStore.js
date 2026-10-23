import { Store, applyMiddleware } from "webext-redux";
import deepPatch from "webext-redux/lib/strategies/deepDiff/patch";
import { FETCH_STATE_TYPE } from "webext-redux/lib/constants";
import { trackDispatches } from "./reporting";

const CHANNEL_NAME = "NOTES_STORE";

// The popup, onboarding page and content scripts all talk to the real redux
// store in the background through this proxy. The background sends state
// changes as deep diffs, so every proxy must apply them with the matching
// deep patch strategy.
export const createProxyStore = (onDisconnect) => {
  const store = applyMiddleware(
    new Store({ channelName: CHANNEL_NAME, patchStrategy: deepPatch }),
    trackDispatches(onDisconnect)
  );

  // Fetches the whole state again, the same way the store does when it is
  // created. Needed after a page missed updates: deep diffs only describe
  // what changed since the previous update, so a page that missed one would
  // otherwise stay out of date until it reloads.
  store.resync = () =>
    chrome.runtime
      .sendMessage({ type: FETCH_STATE_TYPE, channelName: CHANNEL_NAME })
      .then((reply) => store.initializeStore(reply))
      .catch(() => {
        // The extension was reloaded/updated; the disconnect handling covers it
      });

  return store;
};
