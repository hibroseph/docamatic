// First-time hints: a short tip the first time someone could use a feature,
// shown once. Which ones have been put away is saved with the settings
// (metadata.hints), so it follows the notes (backups) and web pages learn it
// from their page view (background/pageViews.js).
export const HINTS = [
  // On a web page, inside the first note someone adds: how to move, fold and change it
  "first_note",
  // In the popup, once there are a few notes: the board shows them all
  "board",
] as const;

export type HintName = (typeof HINTS)[number];

/** How many notes before the popup points at the board */
export const BOARD_HINT_NOTES = 3;
