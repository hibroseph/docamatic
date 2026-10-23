// Error reporting for the notes UI on web pages: errors go to the
// background, which reports them to Sentry (background/startBackground.js,
// REPORT_ERROR), so the Sentry SDK isn't part of the script that runs in
// every page with notes. See utils/reporting.js.
import { setReporter } from "../utils/reporting";
import { CHROME_MESSAGES } from "../utils/constants";

const MAX_BREADCRUMBS = 20;

export const relayErrorsToBackground = () => {
  // Recent actions, sent along with an error (as Sentry would)
  const breadcrumbs: { category?: string; message?: string; at: string }[] = [];

  const send = (report: Record<string, unknown>) =>
    chrome.runtime.sendMessage({ type: CHROME_MESSAGES.REPORT_ERROR, ...report, breadcrumbs: breadcrumbs.slice() }).catch(() => {
      // The extension went away (updated): nothing to report to
    });

  setReporter({
    captureException: (error: unknown, extra?: Record<string, unknown>, options?: { level?: string; tags?: Record<string, string> }) => {
      const err = error as { name?: string; message?: string; stack?: string } | undefined;
      send({
        kind: "exception",
        error: { name: err?.name || "Error", message: err?.message ?? String(error), stack: err?.stack },
        extra,
        level: options?.level,
        tags: options?.tags,
      });
    },
    captureMessage: (message: string, extra?: Record<string, unknown>) => send({ kind: "message", message, extra }),
    addBreadcrumb: (breadcrumb: { category?: string; message?: string }) => {
      breadcrumbs.push({ category: breadcrumb?.category, message: breadcrumb?.message, at: new Date().toISOString() });
      if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
    },
  });
};
