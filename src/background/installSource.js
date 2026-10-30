// Where a new install came from, for the extension_installed event. The
// browser doesn't tell an extension where it was installed from, but at the
// moment of installing, the tabs that led there are usually still open:
//   - came_from_website: a tab with Docamatic's website is open. The site's
//     "Add to Chrome" links open the store in a new tab, so the site stays
//     open behind it.
//   - store_utm_*: the campaign tags on the address of the store listing tab
//     (the site's links add utm_source=docamatic_website and utm_medium for
//     the button), so this works even if the site tab was closed.
// Only these yes/no and label values are sent; never any tab's address.
import { CHROME_WEB_STORE_ID, WEBSITE_URL } from "../utils/constants";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"];
// Campaign tags are labels someone chose; anything else (text, an address,
// an id that's too long) isn't sent
const LABEL = /^[\w.-]{1,40}$/;

const parse = (url) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const isStoreListing = (url) =>
  (url.hostname === "chromewebstore.google.com" || url.hostname === "chrome.google.com") &&
  url.pathname.split("/").includes(CHROME_WEB_STORE_ID);

/** The install event's properties, from the addresses of the open tabs */
export const installSourceFromUrls = (urls) => {
  const parsed = urls.map(parse).filter(Boolean);
  const properties = { came_from_website: parsed.some((url) => url.href.startsWith(WEBSITE_URL)) };
  const store = parsed.find(isStoreListing);
  if (store) {
    properties.store_tab_open = true;
    for (const key of UTM_KEYS) {
      const value = store.searchParams.get(key);
      if (value && LABEL.test(value)) properties[`store_${key}`] = value;
    }
  }
  return properties;
};

/** Looks at the open tabs (addresses are visible to Docamatic with its host permission) */
export const installSource = async () => {
  try {
    const tabs = await chrome.tabs.query({});
    return installSourceFromUrls(tabs.map((tab) => tab.url || tab.pendingUrl || ""));
  } catch {
    return {};
  }
};
