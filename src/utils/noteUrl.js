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
 * The same key with or without a "/" at the end of the path: sites link to
 * /page and /page/ interchangeably (or redirect one to the other), and a
 * note saved on one should show on the other. Not for the site root, which
 * is always "/". Undefined when there's no path to change.
 */
const trailingSlashTwin = (key) => {
  const split = key.search(/[?#]/);
  const base = split === -1 ? key : key.slice(0, split);
  const rest = split === -1 ? "" : key.slice(split);
  const pathStart = base.indexOf("/", base.indexOf("//") + 2);
  if (!base.includes("//") || pathStart === -1 || pathStart === base.length - 1) return undefined;
  return (base.endsWith("/") ? base.slice(0, -1) : base + "/") + rest;
};

/**
 * Every url notes for this page may be saved under: the current key, the key
 * 5.0.0 used (before the Amazon rule), the key notes saved before 5.0 used,
 * and each of those with or without a trailing slash. Each once. New notes
 * are saved under the first, noteUrlFor(href).
 */
export const noteUrlsFor = (href) => {
  if (!href) return [];
  const keys = [noteUrlFor(href), noteUrlWithRules(href, SITE_RULES_5_0), legacyNoteUrl(href)];
  return [...new Set([...keys, ...keys.map(trailingSlashTwin).filter(Boolean)])];
};

// --- Notes on more than one page ------------------------------------------------
//
// A note can be saved under a pattern instead of one page: a key ending in
// "/*", like "https://www.facebook.com/marketplace/*". It shows on every page
// of that site whose path starts there, whatever comes after it (more path,
// any query, any fragment): /marketplace, /marketplace/?ref=bookmark,
// /marketplace/portland/search/?query=moped. "https://www.facebook.com/*" is
// the whole site. Since 5.1. Patterns only ever cover their own site.
//
// They're ordinary keys in `pages`, so storage, backups and everything that
// lists notes work unchanged. 5.0 never shows them (no page's address ends in
// "/*"), and can't read 5.1's storage anyway.

/** Whether a page key is a pattern ("…/*") rather than one page */
export const isPagePattern = (key) => typeof key === "string" && /^(https?|file):\/\/.*\/\*$/.test(key);

/** The address a pattern starts with: "https://www.facebook.com/marketplace/" */
export const patternBase = (key) => (isPagePattern(key) ? key.slice(0, -1) : key);

const parseWebUrl = (href) => {
  try {
    const url = new URL(href);
    return ["http:", "https:", "file:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
};

/** Whether the page at `href` is one of the pages a pattern covers */
export const patternMatches = (pattern, href) => {
  if (!isPagePattern(pattern)) return false;
  const base = parseWebUrl(patternBase(pattern));
  const url = parseWebUrl(href);
  if (!base || !url || base.protocol !== url.protocol || base.host !== url.host) return false;
  // The base path always ends in "/"; the page without it counts too
  // (/marketplace for /marketplace/*)
  const path = url.pathname.replace(/\/{2,}/g, "/");
  return path.startsWith(base.pathname) || path + "/" === base.pathname;
};

/** Whether notes saved under `key` show on the page at `href` */
export const pageShows = (href, key) => noteUrlsFor(href).includes(key) || patternMatches(key, href);

// The pattern keys among a `pages` object's keys, looked up once per object
const patternKeysCache = new WeakMap();
const patternKeysIn = (pages) => {
  if (!pages || typeof pages !== "object") return [];
  let keys = patternKeysCache.get(pages);
  if (!keys) {
    keys = Object.keys(pages).filter(isPagePattern);
    patternKeysCache.set(pages, keys);
  }
  return keys;
};

/**
 * Every key in `pages` whose notes show on the page at `href`: the page's
 * own keys (noteUrlsFor) and the patterns that cover it. Use this, not
 * noteUrlsFor, to find a page's notes.
 */
export const pageKeysFor = (href, pages) => {
  if (!href) return [];
  return [...noteUrlsFor(href), ...patternKeysIn(pages).filter((pattern) => patternMatches(pattern, href))];
};

/**
 * The page's address cut into parts, for choosing which pages a note shows
 * on. Each part of the address stands for itself and everything under it (a
 * pattern). The last part is this page only: the query when there is one,
 * otherwise a "this page" part that isn't in the address (`page: true`).
 * e.g. https://www.facebook.com/marketplace/portland/search/?query=moped ->
 *   www.facebook.com   https://www.facebook.com/*
 *   marketplace        https://www.facebook.com/marketplace/*
 *   portland           https://www.facebook.com/marketplace/portland/*
 *   search             https://www.facebook.com/marketplace/portland/search/*
 *   ?query=moped       https://www.facebook.com/marketplace/portland/search/?query=moped
 * and https://www.facebook.com/marketplace/?ref=bookmark ->
 *   www.facebook.com   https://www.facebook.com/*
 *   marketplace        https://www.facebook.com/marketplace/*
 *   this page          https://www.facebook.com/marketplace/
 * Empty for addresses that aren't web pages.
 * @returns {{ text: string, key: string, page?: boolean }[]}
 */
export const addressParts = (href) => {
  const url = parseWebUrl(href);
  if (!url) return [];
  const exactKey = noteUrlFor(href);
  const origin = `${url.protocol}//${url.host}`;
  const parts = [{ text: url.protocol === "file:" ? "Files on this computer" : url.host, key: `${origin}/*` }];
  let path = "/";
  for (const segment of url.pathname.split("/").filter(Boolean)) {
    path += segment + "/";
    parts.push({ text: safeDecode(segment), key: `${origin}${path}*` });
  }
  // What identifies the page beyond its path (?query=moped, #/route)
  const queryStart = exactKey.search(/[?#]/);
  if (queryStart !== -1) parts.push({ text: safeDecode(exactKey.slice(queryStart)), key: exactKey });
  else parts.push({ text: "this page", key: exactKey, page: true });
  return parts;
};

/** Which of addressParts(href) a note saved under `key` is at, or -1 */
export const addressPartIndex = (parts, key) => parts.findIndex((part) => part.key === key);

/**
 * The narrowest pattern covering both pages, e.g. for
 * …/marketplace/?ref=bookmark and …/marketplace/portland/search/?query=moped:
 * "https://www.facebook.com/marketplace/*". Null for different sites.
 */
export const sharedPattern = (hrefA, hrefB) => {
  const a = parseWebUrl(hrefA);
  const b = parseWebUrl(hrefB);
  if (!a || !b || a.protocol !== b.protocol || a.host !== b.host) return null;
  const segmentsA = a.pathname.split("/").filter(Boolean);
  const segmentsB = b.pathname.split("/").filter(Boolean);
  const shared = [];
  while (shared.length < segmentsA.length && segmentsA[shared.length] === segmentsB[shared.length]) shared.push(segmentsA[shared.length]);
  return `${a.protocol}//${a.host}/${shared.map((segment) => segment + "/").join("")}*`;
};

const safeDecode = (text) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
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
