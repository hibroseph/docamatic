// "Find on page": goes to a note. Switches to a tab that has its page open
// (or opens the page), then asks the page to scroll to the note and point it
// out (page/reveal.ts). A note that was only in the side panel is put on the
// page first.
import { toggleVisibility } from "../redux/actions";
import { CHROME_MESSAGES } from "../utils/constants";
import { pageShows, patternBase } from "../utils/noteUrl";
import { safeHref } from "../utils/SafeLink";
import { track } from "../utils/analytics";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A page that's just been opened needs a moment before its notes are up
const ATTEMPTS = 24;
const ATTEMPT_EVERY_MS = 500;

/** @returns {{ ok: boolean }} */
export const findNote = async (store, pageUrl, noteId) => {
  const note = store.getState().pages?.[pageUrl]?.notes?.find((n) => n.id === noteId);
  if (!note) return { ok: false };
  if (note.visible === false) store.dispatch(toggleVisibility(noteId, pageUrl, true));

  // A tab already showing the page: the one in the focused window first
  const tabs = await chrome.tabs.query({});
  const showing = tabs.filter((tab) => pageShows(tab.url, pageUrl));
  let tab = showing.find((t) => t.active) || showing[0];
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
  } else {
    const href = safeHref(note.created_on_url) || safeHref(patternBase(pageUrl));
    if (!href) return { ok: false };
    tab = await chrome.tabs.create({ url: href });
  }

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const reply = await chrome.tabs
      .sendMessage(tab.id, { action: CHROME_MESSAGES.REVEAL_NOTE, noteId })
      .catch(() => null);
    if (reply?.found) {
      track("note_found_on_page", { opened_tab: showing.length === 0 });
      return { ok: true };
    }
    await sleep(ATTEMPT_EVERY_MS);
  }
  return { ok: false };
};
