// A hidden "offscreen document" the background opens once, to read notes
// saved by the Manifest V2 version of the extension.
//
// That version kept everything in its background page's localStorage. The
// MV3 background is a service worker, which has no localStorage, but an
// offscreen document is an ordinary extension page on the same origin, so it
// can read it. Chrome's offscreen API has a LOCAL_STORAGE reason for exactly
// this kind of migration.
import { findLegacyLocalStorageNotes } from "../../redux/legacyState";

const entries = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  entries[key] = localStorage.getItem(key);
}

chrome.runtime.sendMessage({
  type: "DOCAMATIC_LEGACY_LOCAL_STORAGE",
  notes: findLegacyLocalStorageNotes(entries),
});
