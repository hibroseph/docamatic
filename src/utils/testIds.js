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
  // Opens the board page (board.html)
  popupOpenBoard: "popup-open-board",
  // On the board page: its search box and the "Edit notes" switch
  boardSearch: "board-search",
  boardEditSwitch: "board-edit-switch",

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
  noteSyncError: "note-sync-error",

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
