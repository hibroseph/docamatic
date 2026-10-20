// Shared Sentry setup for every part of the extension (background, popup,
// onboarding page and the content script injected into web pages).
//
// The content script is the tricky one: it runs inside other people's
// websites. Sentry.init() hooks window.onerror, console, fetch, etc. globally,
// which means it would also report the *host page's* errors (that is where the
// "ResizeObserver loop" noise from Facebook came from). Sentry's guidance for
// shared environments like this is to create an isolated client instead, which
// only reports what we explicitly hand it.
// https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
import {
  BrowserClient,
  Hub,
  defaultStackParser,
  getCurrentHub,
  getDefaultIntegrations,
  init,
  makeFetchTransport,
} from "@sentry/browser";
import config from "../../config.json";
import { LIFECYCLE_STORAGE_KEY, lifecycleTags } from "./lifecycle";

const DSN = "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219";

const IGNORED_ERRORS = [
  // Benign browser warnings that fire when layout changes inside a
  // ResizeObserver callback. They are not actionable.
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  // The extension was updated/reloaded while a tab still had the old content
  // script running. The UI already asks the user to reload the page.
  "Extension context invalidated",
];

// Integrations that patch globals. Fine on our own extension pages, but they
// must never be installed into a host web page.
const GLOBAL_INTEGRATIONS = ["GlobalHandlers", "TryCatch", "Breadcrumbs", "HttpContext"];

let hub = null;

/**
 * @param {"background" | "popup" | "onboarding" | "content_script"} context
 *   Which part of the extension this is, attached to every event as a tag so
 *   issues can be filtered in Sentry.
 */
export const initSentry = (context) => {
  // Never let error reporting stop the extension itself from starting
  try {
    const options = {
      dsn: DSN,
      release: config.release_prefix + config.version,
      environment: config.environment,
      ignoreErrors: IGNORED_ERRORS,
      // Only report errors whose stack trace points at our own bundles
      allowUrls: [/^chrome-extension:\/\//],
      // Console output can contain note text or search queries; never send it
      beforeBreadcrumb: (breadcrumb) => (breadcrumb.category === "console" ? null : breadcrumb),
    };

    if (context === "content_script") {
      const client = new BrowserClient({
        ...options,
        transport: makeFetchTransport,
        stackParser: defaultStackParser,
        integrations: getDefaultIntegrations(options).filter((i) => !GLOBAL_INTEGRATIONS.includes(i.name)),
      });
      hub = new Hub(client);
      // Only the hostname, never the full URL, so we don't collect what
      // people are browsing while still being able to spot site-specific bugs
      hub.setTag("page_host", location.hostname);
    } else {
      init(options);
      hub = getCurrentHub();
    }

    hub.setTag("context", context);
    tagReportsFromStorage();
  } catch (err) {
    console.error("Docamatic: unable to start error reporting", err);
  }
};

/**
 * Tags this part of the extension's reports with what storage knows about the
 * install: its random id, which version it was updated from and whether it is
 * the developer's own (filter with internal:false). Read from storage so the
 * popup and the notes UI on web pages get them too. Never creates the install
 * id; the background does that the first time it sends an analytics event and
 * then calls this again.
 */
export const tagReportsFromStorage = async () => {
  try {
    const stored = await chrome.storage.local.get(["analytics", "metadata", LIFECYCLE_STORAGE_KEY]);
    const installType = (await chrome.management?.getSelf?.().catch(() => null))?.installType;
    setReportTags({
      ...lifecycleTags(stored[LIFECYCLE_STORAGE_KEY]),
      internal: installType === "development" || stored.analytics?.internal === true,
      ...(installType ? { install_type: installType } : {}),
    });
    // metadata can be malformed here (that's what safe mode is for), so only
    // an explicit opt-out counts
    if (stored.metadata?.analytics_enabled !== false) setReportInstallId(stored.analytics?.installId);
  } catch (err) {
    console.debug("Docamatic: couldn't tag error reports", err);
  }
};

/**
 * What an error means for the user, as the `impact` tag, so the reports that
 * matter most can be found (and alerted on) in Sentry: `impact:unusable`.
 */
export const IMPACT = {
  // Docamatic doesn't work at all (e.g. safe mode: no notes shown, nothing saved)
  UNUSABLE: "unusable",
  // Changes may not be saved
  NOTES_NOT_SAVED: "notes_not_saved",
  // Notes from the Manifest V2 version weren't brought over
  OLD_NOTES_MISSING: "old_notes_missing",
};

/**
 * @param extra    small values shown under "Additional Data"
 * @param options  level ("fatal", "error", ...), tags (searchable in Sentry),
 *                 contexts ({ name: flat object }, each shown as its own section)
 */
export const captureException = (error, extra, { level, tags, contexts } = {}) => {
  if (!hub) return;
  hub.withScope((scope) => {
    if (extra) scope.setExtras(extra);
    if (level) scope.setLevel(level);
    if (tags) scope.setTags(tags);
    Object.entries(contexts || {}).forEach(([name, context]) => scope.setContext(name, context));
    hub.captureException(error);
  });
};

/**
 * Tags added to every report from now on, e.g. which version this install
 * was updated from. Values must be short strings.
 */
export const setReportTags = (tags) => {
  if (!hub) return;
  Object.entries(tags).forEach(([key, value]) => hub.setTag(key, String(value)));
};

/**
 * Links reports to this install's random id (the one PostHog events use), so
 * Sentry can count affected installs and an install's errors can be looked
 * up in PostHog. Not set when the user turned usage statistics off.
 */
export const setReportInstallId = (installId) => {
  if (!hub || !installId) return;
  hub.setUser({ id: installId });
};

export const captureMessage = (message, extra) => {
  if (!hub) return;
  hub.withScope((scope) => {
    if (extra) scope.setExtras(extra);
    hub.captureMessage(message, "warning");
  });
};

export const addBreadcrumb = (breadcrumb) => {
  hub?.addBreadcrumb(breadcrumb);
};

/**
 * Redux middleware for the background store. Reducer errors would otherwise
 * only show up as a rejected promise in whichever page dispatched the action,
 * without the background stack trace.
 */
export const reportReducerErrors = () => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    captureException(error, { action: action?.type });
    throw error;
  }
};

/**
 * Redux middleware for the proxy stores in the popup and content script.
 * Records each action as a breadcrumb, so an error report shows what the user
 * did just before it, and reports dispatches the background couldn't handle.
 */
export const trackDispatches = (onDisconnect) => () => (next) => (action) => {
  // The extension was reloaded or updated: this page's copy of the script is
  // orphaned and chrome.runtime no longer works.
  if (!chrome.runtime?.id) {
    onDisconnect?.();
    return Promise.resolve();
  }

  addBreadcrumb({ category: "redux.action", message: action?.type, level: "info" });

  return Promise.resolve(next(action)).catch((error) => {
    // Reducer errors are reported with their real stack trace by
    // reportReducerErrors in the background; don't count them twice.
    if (!String(error?.message).includes("error in the background page")) {
      captureException(error, { action: action?.type });
    }
  });
};
