export const COLORS = ["#ed5565", "#f8ac59", "#c1e5ef", "#1799c6", "#08597d"];
export const THEME = {
  Primary: "#08597d",
  Secondary: "#f8ac59",
  Accent: "#1799c6",
  Active: "#0d8cc5",
};
export const INITIAL_NOTE_WIDTH = 225;

export const CHROME_MESSAGES = {
  // Popup -> page: where to put a new note
  GET_PAGE_INFORMATION: "get_page_information",
  // Popup -> page: a note was just created here, show the notes UI
  SHOW_NOTES: "show_notes",
  // Page -> background: inject the notes UI into this tab
  MOUNT_NOTES_UI: "mount_notes_ui",
};

// The notes UI bundle the background injects into pages that have notes
// (built without a hash in its name so the background can reference it)
export const NOTES_UI_FILE = "notes-ui.js";
