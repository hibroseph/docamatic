// The original rule for which url a note is saved under: drops everything
// after "?" or "#". Replaced by noteUrlFor() in noteUrl.js, which keeps the
// parts that identify a page; this is still used to find notes saved under
// the old rule. Never change what it returns, or those notes stop showing.

export const GetSafeNoteUrl = (url) => {
  if (!url) return url;

  let safeUrl = url.split(/[?#]/)[0];

  // Urls without "//" (about:blank, data:, ...) have nothing to normalize,
  // and the code below would throw on them
  if (!safeUrl.includes("//")) return safeUrl;

  // Note: only the part between the first and second "//" is kept, so
  // "https://a.com//b" becomes "https://a.com". Notes are stored under these
  // keys, so changing that would hide existing notes on such urls.
  let protocol = safeUrl.split("//")[0];
  let afterProtocol = safeUrl.split("//")[1].replace(/\/+/g, "/");

  let safestUrl = protocol + "//" + afterProtocol;
  // consolidate multiple slashes in a row
  return safestUrl;
};
