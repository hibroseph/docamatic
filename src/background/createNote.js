// Adding a note to a tab: the core flow, so each step is measured. A funnel
// of note_create_started -> note_created -> note_shown in PostHog shows how
// often it works, and note_create_failed says where it breaks. Failures that
// aren't expected (i.e. bugs) also go to Sentry.
import { addNote } from "../redux/actions";
import { CHROME_MESSAGES } from "../utils/constants";
import { generateUUID } from "../utils/GenerateUUID";
import { noteUrlFor, noteUrlsFor, redactUrl } from "../utils/noteUrl";
import { canHaveNotes, hostnameOf, isExpectedScriptingError, messageWithoutUrls } from "../utils/expectedFailures";
import { captureMessage } from "../utils/sentry";
import { track } from "../utils/analytics";
import { notesOnPage } from "../redux/pageNotes";
import { NEW_NOTE_WIDTH, placeNewNote } from "../model/placement";
import { DEFAULT_NOTE_COLOR, isNoteColorName } from "../model/colors";

// Used for side panel notes when the page can't tell us its size
const FALLBACK_PAGE = { scrollPosition: 0, scrollLeft: 0, pageWidth: 1280, pageHeight: 800 };

const getPageInformation = (tabId) => chrome.tabs.sendMessage(tabId, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION });

/**
 * Asks the page where the note can go. Tabs open since before the extension
 * was installed (or updated) don't have the content script yet; it's added
 * and asked again.
 * Returns { info } or { error: { stage, expected, error } }.
 */
const pageInformationFor = async (tab) => {
  try {
    return { info: await getPageInformation(tab.id) };
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: chrome.runtime.getManifest().content_scripts[0].js,
      });
    } catch (error) {
      // Often expected (e.g. a page the browser won't let extensions script)
      return { error: { stage: "add_content_script", expected: isExpectedScriptingError(error), error } };
    }
    try {
      return { info: await getPageInformation(tab.id) };
    } catch (error) {
      // The script was added but the page still doesn't answer: always a bug
      return { error: { stage: "page_unresponsive", expected: false, error } };
    }
  }
};

/**
 * @param store the background redux store
 * @param tab the tab to add the note to
 * @param placement "page": on the page, where the person is looking;
 *   "panel": a note that only shows in the side panel (it can be put on the
 *   page later, at the position chosen now)
 * @param source "popup" | "sidepanel" | "shortcut", for analytics
 * @returns {{ ok: true, noteId, pageUrl } | { ok: false, reason }}
 */
export const createNoteInTab = async (store, tab, { placement = "page", source = "popup" } = {}) => {
  track("note_create_started", { source, placement });

  const fail = (stage, expected, error) => {
    track("note_create_failed", { stage, expected, source });
    if (!expected) {
      captureMessage("Creating a note failed", {
        stage,
        page_host: hostnameOf(tab?.url),
        error: error ? messageWithoutUrls(error) : undefined,
      });
    }
    return { ok: false, reason: stage };
  };

  // chrome:// pages, the extension stores, ...: no extension can add to these
  if (!tab?.id || !canHaveNotes(tab.url)) return fail("page_not_supported", true);

  const { info, error } = await pageInformationFor(tab);
  // A side panel note doesn't need the page; it only uses its size, if it can
  if (error && placement !== "panel") return fail(error.stage, error.expected, error.error);

  const href = info?.page || tab.url;
  const pageUrl = noteUrlFor(href);
  const state = store.getState();
  const existing = notesOnPage(state, noteUrlsFor(href)).map(({ note }) => note.position).filter(Boolean);
  const position = placeNewNote(info || FALLBACK_PAGE, existing);
  const preferred = state.metadata?.preferences?.new_note_color;

  const noteId = generateUUID();
  // The background shows the notes UI in every tab with this page open once
  // the note is added (see showNotesWhenPagesGainNotes)
  store.dispatch(
    addNote(noteId, position.y, pageUrl, redactUrl(href), {
      position,
      width: NEW_NOTE_WIDTH,
      color: isNoteColorName(preferred) ? preferred : DEFAULT_NOTE_COLOR,
      visible: placement !== "panel",
      pageTitle: tab.title,
    })
  );
  return { ok: true, noteId, pageUrl };
};
