import { IMPORT_NOTES, NUKE_NOTES, REPLACE_STATE, SET_ANALYTICS_ENABLED, TRACK } from "./actions";
import { GetSafeNoteUrl } from "../utils/GetSafeNoteUrl";
import { captureMessage } from "../utils/sentry";

// Actions that affect every page, or settings/analytics. Only our own
// extension pages (popup, onboarding) may send these.
const PRIVILEGED_ACTIONS = new Set([NUKE_NOTES, IMPORT_NOTES, REPLACE_STATE, SET_ANALYTICS_ENABLED, TRACK]);

const hostnameOf = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
};

/**
 * Redux middleware for the background store.
 *
 * Content scripts live inside the web page's renderer process, so they are
 * the least trusted part of the extension: a page that compromises its
 * renderer can send any message a content script could. This limits content
 * scripts to editing the notes of the page they are running on.
 *
 * webext-redux attaches the chrome.runtime.MessageSender as `_sender`. The
 * browser fills in the sender, so a page can't fake it.
 */
export const authorizeSender = () => (next) => (action) => {
  const sender = action._sender;

  // Dispatched from inside the background itself
  if (!sender) return next(action);

  const fromThisExtension = sender.id === chrome.runtime.id;
  const fromExtensionPage = fromThisExtension && Boolean(sender.url?.startsWith(chrome.runtime.getURL("")));

  if (fromExtensionPage) return next(action);

  const fromOwnPage = fromThisExtension && Boolean(action.url) && action.url === GetSafeNoteUrl(sender.url);

  if (PRIVILEGED_ACTIONS.has(action.type) || !fromOwnPage) {
    captureMessage("Blocked an action a content script isn't allowed to send", {
      action: action.type,
      page_host: hostnameOf(sender.url),
    });
    return;
  }

  return next(action);
};
