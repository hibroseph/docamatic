// Telling expected failures (which aren't bugs) from unexpected ones (which
// should be reported). Extensions can't run on some pages at all, and Chrome
// unloads or closes tabs at any moment; reporting those would bury real bugs
// in noise.

const NOT_SCRIPTABLE_HOSTS = ["chromewebstore.google.com", "chrome.google.com", "microsoftedge.microsoft.com"];

/**
 * Whether notes can be put on this page at all. Browser pages (chrome://,
 * edge://, about:, ...), the extension stores and non-web urls can't be
 * scripted by any extension.
 */
export const canHaveNotes = (href) => {
  let url;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (!["http:", "https:", "file:"].includes(url.protocol)) return false;
  return !NOT_SCRIPTABLE_HOSTS.includes(url.hostname);
};

// Messages Chrome gives when a tab simply can't be scripted right now
const EXPECTED_SCRIPTING_ERRORS = [
  /no tab with id/i, // tab was closed
  /frame with id \d+ (was removed|is showing error page)/i, // navigated away, or an error page
  /cannot access (contents of|a chrome|a chrome-extension)/i, // page not scriptable / no access
  /extensions gallery cannot be scripted/i,
  /tabs cannot be (edited|queried) right now/i, // e.g. while being dragged
  /the tab was closed/i,
  /no frame with id/i,
  /could not establish connection/i, // page has no content script yet / was unloaded
  /receiving end does not exist/i,
];

/** True for errors from chrome.scripting / chrome.tabs that aren't bugs */
export const isExpectedScriptingError = (error) => {
  const message = error?.message || String(error || "");
  return EXPECTED_SCRIPTING_ERRORS.some((pattern) => pattern.test(message));
};

export const hostnameOf = (href) => {
  try {
    return new URL(href).hostname;
  } catch {
    return undefined;
  }
};

/**
 * An error message safe to send to Sentry: Chrome's messages can contain the
 * full page url, and only hostnames are ever reported (see the privacy policy).
 */
export const messageWithoutUrls = (error) =>
  (error?.message || String(error || "")).replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, "[url]");
