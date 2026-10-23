// Error reporting for code that runs both on Docamatic's own pages and in
// the notes UI on web pages (components, stores). It forwards to whatever
// reporter was set up:
//   - Docamatic's pages and the background: Sentry (utils/sentry.js initSentry)
//   - the notes UI on web pages: a relay to the background, which reports to
//     Sentry for it (page/relayErrors.ts). That keeps the Sentry SDK out of
//     the script that runs in web pages, which has to load fast.
// Before a reporter is set, calls do nothing.
let reporter = null;

/** @param r {{ captureException, captureMessage, addBreadcrumb }} */
export const setReporter = (r) => {
  reporter = r;
};

export const captureException = (error, extra, options) => reporter?.captureException(error, extra, options);
export const captureMessage = (message, extra) => reporter?.captureMessage(message, extra);
export const addBreadcrumb = (breadcrumb) => reporter?.addBreadcrumb(breadcrumb);

/**
 * Redux middleware for proxy stores (Docamatic's pages) and the notes UI's
 * page store: notices the extension went away, keeps a breadcrumb per
 * action, and reports dispatches that failed.
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
