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
  noteOpenPage: "note-open-page",
  // One per color choice. Also has data-color="<hex>".
  noteColor: "note-color",
  // An existing tag on a note. Also has data-tag-text="<text>".
  noteTag: "note-tag",
  noteAddTag: "note-add-tag",
  noteSyncError: "note-sync-error",
};
