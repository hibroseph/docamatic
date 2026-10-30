// Stable hooks for automated browser tests, rendered as data-testid attributes.
//
// IMPORTANT: never rename or remove an id once it has shipped. The upgrade
// test drives the *previously published* version of the extension with these
// same ids, so a rename breaks the next release's upgrade test. Adding new ids
// is always fine.
//
// Notes on web pages render inside a closed shadow root; browser tests reach
// them through the Chrome DevTools Protocol (DOM.getDocument with pierce: true),
// so nothing about the shadow root has to change for tests.
export const TEST_IDS = {
  // Popup navigation, one per section: new, current, search, sort, hearted, settings
  popupNav: (name) => `popup-nav-${name}`,
  popupCreateNote: "popup-create-note",
  // When a new note couldn't go on the page: the message, and what to try
  popupCreateFailure: "popup-create-failure",
  popupRetryAfterReload: "popup-retry-after-reload",
  popupKeepNoteInstead: "popup-keep-note-instead",
  // Docamatic isn't allowed on the open site: the notice and its Allow button
  siteAccess: "site-access",
  siteAccessAllow: "site-access-allow",
  // A survey from PostHog in the popup: the card, its Next/Send and No thanks
  survey: "survey",
  surveyNext: "survey-next",
  surveyDismiss: "survey-dismiss",
  // Feedback from Settings: the form and the link to it
  feedbackMessage: "feedback-message",
  feedbackEmail: "feedback-email",
  feedbackSend: "feedback-send",
  settingsFeedback: "settings-feedback",
  // "Download diagnostic report" (Settings, and the safe mode screen)
  diagnosticsDownload: "diagnostics-download",
  // Opens the board page (board.html)
  popupOpenBoard: "popup-open-board",
  // "See them all on the board" in All notes
  allNotesOpenBoard: "all-notes-open-board",
  // On the board page: its search box and the "Edit notes" switch
  boardSearch: "board-search",
  boardEditSwitch: "board-edit-switch",
  // A board card's Open button, and the note opened in full
  boardNoteOpen: "board-note-open",
  boardNoteDialog: "board-note-dialog",
  // The canvas's "Group by" choice: tag or site
  boardGroupBy: (grouping) => `board-group-by-${grouping}`,

  searchInput: "search-input",
  searchAvailableTag: "search-available-tag",
  searchSelectedTag: "search-selected-tag",

  settingsAnalyticsToggle: "settings-analytics-toggle",
  settingsNuke: "settings-nuke",
  settingsNukeConfirm: "settings-nuke-confirm",
  settingsNukeCancel: "settings-nuke-cancel",

  // A note, on a web page or in the popup. Also has data-note-id="<id>".
  note: "note",
  noteTitle: "note-title",
  noteBody: "note-body",
  noteFavorite: "note-favorite",
  noteDelete: "note-delete",
  noteVisibility: "note-visibility",
  noteDragHandle: "note-drag-handle",
  // The collapse/expand button in a note's top bar on a page
  noteCollapse: "note-collapse",
  noteOpenPage: "note-open-page",
  // "Find on page" in a note's menu in the popup and side panel
  noteFind: "note-find",
  // "Bring here" in a note's menu, for notes on the page that's open
  noteBringHere: "note-bring-here",
  // Where a note on the open page is, in the popup and side panel ("Further down the page", ...)
  notePlace: "note-place",
  // One per color choice. Also has data-color="<hex>".
  noteColor: "note-color",
  // An existing tag on a note. Also has data-tag-text="<text>".
  noteTag: "note-tag",
  noteAddTag: "note-add-tag",
  // "Show on other pages" in a note's menu, and the picker it opens: one
  // button per part of the address (data-part-index="<n>"), Save and Cancel
  noteShowOn: "note-show-on",
  pagesPicker: "pages-picker",
  pagesPickerPart: "pages-picker-part",
  pagesPickerSave: "pages-picker-save",
  pagesPickerCancel: "pages-picker-cancel",
  // The popup's "Can't find a note?" list on a page without notes: one row
  // per note elsewhere on the site, and its buttons
  lostNote: "lost-note",
  lostNoteShowHere: "lost-note-show-here",
  lostNoteMoveHere: "lost-note-move-here",
  noteSyncError: "note-sync-error",
  // The first-time tip inside a new note on a page, and its "Got it" button
  noteHint: "note-hint",
  noteHintDismiss: "note-hint-dismiss",
  // The popup's first-time pointer to the board, and its buttons
  boardHint: "board-hint",
  boardHintOpen: "board-hint-open",
  boardHintDismiss: "board-hint-dismiss",

  settingsBackupRestore: "settings-backup-restore",
  popupSafeModeBanner: "popup-safe-mode-banner",

  // The Backup & restore page (options.html). Written as literals in
  // apps/options/options.html and options.js, which avoid other imports.
  backupSafeModeBanner: "backup-safe-mode-banner",
  backupDownload: "backup-download",
  backupImportFile: "backup-import-file",
  backupList: "backup-list",
  // One per automatic backup row, and its restore button
  backupEntry: "backup-entry",
  backupRestore: "backup-restore",
};
