// Sentry setup for the background and Docamatic's own pages (popup, side
// panel, board, welcome page, Backup & restore).
//
// The notes UI on web pages doesn't load Sentry at all: its errors are
// relayed to the background, which reports them (page/relayErrors.ts,
// REPORT_ERROR). Code shared by both reports through utils/reporting.js,
// which initSentry points here.
import { getCurrentHub, init } from "@sentry/browser";
import { setReporter, trackDispatches } from "./reporting";
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

let hub = null;

/**
 * @param {"background" | "popup" | "sidepanel" | "onboarding" | "board" | "content_script"} context
 *   Which part of the extension this is, attached to every event as a tag so
 *   issues can be filtered in Sentry.
 */
export const initSentry = (context) => {
  errorContext = context;
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

    init(options);
    hub = getCurrentHub();
    hub.setTag("context", context);
    // Shared code (utils/reporting.js) reports here from now on
    setReporter({ captureException, captureMessage, addBreadcrumb });
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
// The last errors on this install, kept locally for the diagnostic report
// people can download from Settings (background/diagnostics.js). Only when it
// happened, where (`during`), what kind and the message with any web
// addresses taken out.
export const RECENT_ERRORS_KEY = "recentErrors";
const MAX_RECENT_ERRORS = 25;
let errorContext = "unknown";

const rememberError = (kind, message, extra, context = errorContext) => {
  try {
    if (!globalThis.chrome?.storage?.local) return;
    const entry = {
      at: new Date().toISOString(),
      context,
      kind,
      during: typeof extra?.during === "string" ? extra.during.slice(0, 100) : undefined,
      message: String(message || "").replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, "[url]").slice(0, 300),
    };
    chrome.storage.local
      .get(RECENT_ERRORS_KEY)
      .then((stored) => {
        const list = Array.isArray(stored[RECENT_ERRORS_KEY]) ? stored[RECENT_ERRORS_KEY] : [];
        return chrome.storage.local.set({ [RECENT_ERRORS_KEY]: [...list, entry].slice(-MAX_RECENT_ERRORS) });
      })
      .catch(() => {});
  } catch {
    // Remembering an error must never cause one
  }
};

export const captureException = (error, extra, { level, tags, contexts } = {}) => {
  rememberError(level || "error", error?.message || error, extra, tags?.context);
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
  rememberError("warning", [message, extra?.stage, extra?.error].filter(Boolean).join(": "), extra);
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
// Moved to utils/reporting.js (shared with the notes UI on web pages)
export { trackDispatches };
