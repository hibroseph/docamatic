import { Store, applyMiddleware } from "webext-redux";
import deepPatch from "webext-redux/lib/strategies/deepDiff/patch";
import { trackDispatches } from "./sentry";

// The popup, onboarding page and content scripts all talk to the real redux
// store in the background through this proxy. The background sends state
// changes as deep diffs, so every proxy must apply them with the matching
// deep patch strategy.
export const createProxyStore = (onDisconnect) =>
  applyMiddleware(
    new Store({ channelName: "NOTES_STORE", patchStrategy: deepPatch }),
    trackDispatches(onDisconnect)
  );
