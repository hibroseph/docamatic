// Removes query strings and other variances in urls so your note shows up where you want it/expect it

export const GetSafeNoteUrl = (url) => {
  let safeUrl = url.split(/[?#]/)[0];

  let protocol = safeUrl.split("//")[0];
  let afterProtocol = safeUrl.split("//")[1].replace(/\/+/g, "/");

  let safestUrl = protocol + "//" + afterProtocol;
  // consolidate multiple slashes in a row
  return safestUrl;
};
