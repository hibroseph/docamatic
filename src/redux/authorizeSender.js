import { IMPORT_NOTES, NUKE_NOTES, REPLACE_STATE, SET_ANALYTICS_ENABLED, TRACK } from "./actions";
import { captureMessage } from "../utils/sentry";

// Actions that affect every page, or settings/analytics. Only our own
// extension pages (popup, onboarding) may send these.
const PRIVILEGED_ACTIONS = new Set([NUKE_NOTES, IMPORT_NOTES, REPLACE_STATE, SET_ANALYTICS_ENABLED, TRACK]);

const parse = (url) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

// "https://github.com", or "file:" for local files (which have no host)
const originOf = (url) => {
  const parsed = parse(url);
  if (!parsed) return null;
  return parsed.protocol === "file:" ? "file:" : parsed.origin;
};

/** Whether two urls are on the same site (scheme + host; all local files count as one) */
export const sameSite = (a, b) => {
  const origin = originOf(a);
  return Boolean(origin) && origin === originOf(b);
};

/**
 * Why a content script's action isn't allowed, or null if it is. Content
 * scripts may change notes of their own origin (scheme + host).
 *
 * Why the origin rather than the exact page: Chrome isolates pages per site,
 * so a compromised github.com page can already navigate itself to any
 * github.com url. Restricting it to its exact url adds no protection, but it
 * did block legitimate edits whenever the url a note is saved under and the
 * tab's current url differ slightly (right after a single page app navigates,
 * notes saved under the old url rules, fragments, ...), silently losing them.
 */
export const reasonToBlock = (action, sender, extensionId) => {
  if (sender.id !== extensionId) return "other_extension";
  if (PRIVILEGED_ACTIONS.has(action.type)) return "privileged_action";
  if (!action.url) return "no_url";
  if (!sameSite(sender.url, action.url)) return "different_site";
  return null;
};

/**
 * Redux middleware for the background store.
 *
 * Content scripts live inside the web page's renderer process, so they are
 * the least trusted part of the extension: a page that compromises its
 * renderer can send any message a content script could. This limits content
 * scripts to the notes of their own site, and keeps actions that affect
 * everything (deleting all notes, importing, settings) to extension pages.
 *
 * webext-redux attaches the chrome.runtime.MessageSender as `_sender`. The
 * browser fills in the sender, so a page can't fake it.
 */
export const authorizeSender = () => (next) => (action) => {
  const sender = action._sender;

  // Dispatched from inside the background itself
  if (!sender) return next(action);

  const fromExtensionPage =
    sender.id === chrome.runtime.id && Boolean(sender.url?.startsWith(chrome.runtime.getURL("")));
  if (fromExtensionPage) return next(action);

  const reason = reasonToBlock(action, sender, chrome.runtime.id);
  if (reason) {
    // Only the hostname, never full urls (see the privacy policy)
    captureMessage("Blocked an action a content script isn't allowed to send", {
      action: action.type,
      reason,
      page_host: parse(sender.url)?.hostname,
      note_host: parse(action.url)?.hostname,
    });
    return;
  }

  return next(action);
};
