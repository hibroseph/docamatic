// The note colors before 5.1. Notes that have one keep it; new notes use the
// palette in model/colors.ts. Still used to repair very old notes saved
// without a color (redux/legacyState.js).
export const COLORS = ["#ed5565", "#f8ac59", "#c1e5ef", "#1799c6", "#08597d"];
// Width of notes created without one (new notes: model/placement.ts)
export const INITIAL_NOTE_WIDTH = 225;

export const CHROME_MESSAGES = {
  // Popup -> page: where to put a new note
  GET_PAGE_INFORMATION: "get_page_information",
  // Page -> background: inject the notes UI into this tab
  MOUNT_NOTES_UI: "mount_notes_ui",
  // Background -> page: the url changed without a page load (single page app)
  URL_CHANGED: "url_changed",
  // Page -> background: a just-created note is now visible on the page
  NOTE_SHOWN: "note_shown",
  // Backup & restore page -> background
  GET_BACKUP_STATUS: "get_backup_status",
  IMPORT_BACKUP: "import_backup",
  RESTORE_BACKUP: "restore_backup",
  // Popup / side panel -> background: add a note to a tab (since 5.1; the
  // background does it so the popup, side panel and keyboard shortcut share
  // one path)
  CREATE_NOTE: "create_note",
  // Popup -> background: feedback the person wrote and chose to send
  SEND_FEEDBACK: "send_feedback",
  // Popup -> background: the survey to show (from PostHog), and what
  // happened with it (shown, dismissed, sent)
  GET_SURVEY: "get_survey",
  SURVEY_EVENT: "survey_event",
  // Settings -> background: the diagnostic report to download
  GET_DIAGNOSTICS: "get_diagnostics",
  // Popup / side panel -> background: go to a note on its page ("Find on page")
  FIND_NOTE: "find_note",
  // Background -> page: scroll to this note and point it out
  REVEAL_NOTE: "reveal_note",
  // Popup / side panel -> page: move this note to what's on screen ("Bring here")
  BRING_NOTE_HERE: "bring_note_here",
  // Popup / side panel -> page: where is each note (on screen, further down, ...)
  NOTE_PLACES: "note_places",
};

// Keyboard shortcut command (wxt.config.ts)
export const CREATE_NOTE_COMMAND = "create-note";

// The right-click menu item
export const CONTEXT_MENU_ADD_NOTE = "add-note-here";

// The notes UI bundle the background injects into pages that have notes
// (built without a hash in its name so the background can reference it)
export const NOTES_UI_FILE = "notes-ui.js";

// Docamatic's website, and its Chrome Web Store listing id. Used to tell
// whether an install came through the website (background/installSource.js).
export const WEBSITE_URL = "https://hibroseph.github.io/docamatic/";
export const CHROME_WEB_STORE_ID = "mbpkbeacgamdiajpgbblpcgpkidaobob";
