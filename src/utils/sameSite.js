// Whether two addresses are on the same site. Its own module so code that
// runs in web pages (the reducer, via the demos) doesn't pull in the
// background's sender checks and Sentry (redux/authorizeSender.js).

/** The url parsed, or null when it isn't one */
export const parse = (url) => {
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
