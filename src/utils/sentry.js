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
 * @param {"background" | "popup" | "sidepanel" | "onboarding" | "content_script"} context
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
      allowUrls: [/^(chrome|moz)-extension:\/\//],
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
  } catch (err) {
    console.error("Docamatic: unable to start error reporting", err);
  }
};

export const captureException = (error, extra) => {
  if (!hub) return;
  hub.withScope((scope) => {
    if (extra) scope.setExtras(extra);
    hub.captureException(error);
  });
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
