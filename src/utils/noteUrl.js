// Which "page" a note belongs to: the url it is saved under.
//
// A page's address can contain things that identify the content (YouTube's
// ?v=, a forum's ?t=, an app's #/route) and things that don't (tracking
// parameters, timestamps, #section anchors). Notes are saved under the url
// with only the identifying parts kept, so a note shows on that content and
// nowhere else, however the page was reached.
//
// Before this, everything after "?" or "#" was dropped (see GetSafeNoteUrl.js),
// so e.g. a note on one YouTube video showed on every video. Notes saved that
// way keep their old key, and noteUrlsFor() returns both keys so those notes
// still show where they always have.
import { GetSafeNoteUrl as legacyNoteUrl } from "./GetSafeNoteUrl";

export { legacyNoteUrl };

// Query parameters that commonly identify what a page shows. Anything else
// is dropped: keeping a parameter by mistake makes notes "disappear" when the
// page is reached through a link with different tracking parameters, while
// dropping one by mistake only shares notes between those pages (the old
// behavior). Extend this, or SITE_RULES, when a site needs it.
const IDENTIFYING_PARAMS = new Set([
  "id",
  "p", // WordPress posts
  "page_id",
  "q", // search queries
  "query",
  "search",
  "t", // forum topics (phpBB, vBulletin)
  "topic",
  "f", // forum sections
  "thread",
  "item",
  "story",
  "article",
  "product",
  "pid",
  "title", // e.g. MediaWiki index.php?title=
]);

// Sites where the generic rules get it wrong. `params` replaces the
// identifying parameters for matching urls; `path` replaces the path.
const YOUTUBE_WATCH = {
  // Only v identifies the video; t is a timestamp, list/index a playlist
  matches: (url) => /(^|\.)youtube\.com$/.test(url.hostname) && url.pathname === "/watch",
  params: ["v"],
};

// Amazon reaches one product through many addresses: with the product name
// in front (/Some-Name/dp/B0ABC12345), tracking after it (/ref=...), or as
// /gp/product/B0ABC12345. The 10-character product id (ASIN) is what
// identifies it. Since 5.1.
const AMAZON_PRODUCT = /\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/asin)\/([A-Z0-9]{10})(?:[/?]|$)/i;
const AMAZON = {
  matches: (url) => /(^|\.)amazon\.[a-z.]+$/.test(url.hostname) && AMAZON_PRODUCT.test(url.pathname),
  params: [],
  path: (url) => `/dp/${url.pathname.match(AMAZON_PRODUCT)[1].toUpperCase()}`,
};

const SITE_RULES = [YOUTUBE_WATCH, AMAZON];

// The rules 5.0.0 saved notes under. Notes saved then are still found (see
// noteUrlsFor); never change this list.
const SITE_RULES_5_0 = [YOUTUBE_WATCH];

// Fragments that are routes (#/inbox, #!/settings), not in-page anchors
const isRouteFragment = (hash) => /^#!?\//.test(hash);

/**
 * The url a note on this page is saved under.
 * e.g. https://www.youtube.com/watch?v=abc&t=42s&utm_source=x -> https://www.youtube.com/watch?v=abc
 */
export const noteUrlFor = (href) => noteUrlWithRules(href, SITE_RULES);

const noteUrlWithRules = (href, rules) => {
  let url;
  try {
    url = new URL(href);
  } catch {
    return legacyNoteUrl(href);
  }
  // Only web pages have meaningful parts to keep (not about:, data:, ...)
  if (!["http:", "https:", "file:"].includes(url.protocol)) {
    return legacyNoteUrl(href);
  }

  const rule = rules.find((siteRule) => siteRule.matches(url));
  const keep = rule ? new Set(rule.params) : IDENTIFYING_PARAMS;

  const params = [...url.searchParams]
    .filter(([name, value]) => keep.has(name) && value !== "")
    .sort(([a, aValue], [b, bValue]) => (a === b ? aValue.localeCompare(bValue) : a.localeCompare(b)));
  const query = params.length > 0 ? "?" + new URLSearchParams(params).toString() : "";

  const path = rule?.path ? rule.path(url) : url.pathname.replace(/\/{2,}/g, "/");
  const fragment = isRouteFragment(url.hash) ? url.hash : "";

  return `${url.protocol}//${url.host}${path}${query}${fragment}`;
};

/**
 * Every url notes for this page may be saved under: the current key, the key
 * 5.0.0 used (before the Amazon rule), and the key notes saved before 5.0
 * used. Each once.
 */
export const noteUrlsFor = (href) => {
  if (!href) return [];
  return [...new Set([noteUrlFor(href), noteUrlWithRules(href, SITE_RULES_5_0), legacyNoteUrl(href)])];
};

// Parameter names that may hold credentials: tokens, OAuth codes, sessions,
// keys, signatures, passwords. Deliberately broad (e.g. "author" matches
// "auth"): dropping a harmless parameter costs nothing, keeping a secret does.
const SENSITIVE_PARAM = /token|secret|passw|pwd|session|sessid|signature|auth|credential|apikey|api_key|^(code|state|key|sig|sid|otp|nonce|ticket|jwt|saml\w*)$/i;

// Removes credential-like parameters from a query string (without "?").
// Returns it untouched when there's nothing to remove, so the record keeps
// its exact original encoding.
const redactQuery = (query) => {
  const params = new URLSearchParams(query);
  const sensitive = [...params.keys()].filter((name) => SENSITIVE_PARAM.test(name));
  if (sensitive.length === 0) return query;
  sensitive.forEach((name) => params.delete(name));
  return params.toString();
};

/**
 * The page address a note was created on, kept with the note as a record
 * (notes are found by noteUrlFor, not this). Everything is kept except
 * anything that may be a credential, because notes end up in backup files
 * people send around and possibly synced storage later: credential-like
 * query/fragment parameters and any user:password@ in the address.
 */
export const redactUrl = (href) => {
  let url;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (!["http:", "https:", "file:"].includes(url.protocol)) return undefined;

  url.username = "";
  url.password = "";

  const query = redactQuery(url.search.slice(1));
  url.search = query ? "?" + query : "";

  // Fragments can carry tokens too: OAuth puts them in "#access_token=...",
  // and #-routed apps in "#/callback?code=..."
  const fragment = url.hash.slice(1);
  if (isRouteFragment(url.hash)) {
    const [route, routeQuery] = splitOnce(fragment, "?");
    if (routeQuery !== undefined) {
      const redacted = redactQuery(routeQuery);
      url.hash = redacted ? `${route}?${redacted}` : route;
    }
  } else if (fragment.includes("=")) {
    url.hash = redactQuery(fragment);
  }

  return url.toString();
};

const splitOnce = (text, separator) => {
  const index = text.indexOf(separator);
  return index === -1 ? [text, undefined] : [text.slice(0, index), text.slice(index + 1)];
};
