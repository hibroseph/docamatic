// Where a new note goes on a page. Only new notes: existing notes keep the
// exact position they were saved with.

export const NEW_NOTE_WIDTH = 240;
const MARGIN = 24;
const TOP_OFFSET = 96;
const CASCADE = 28;

export interface PageInfo {
  scrollPosition: number;
  scrollLeft?: number;
  pageWidth: number;
  pageHeight: number;
}

/**
 * Near the top right of what's on screen: the page margin, beside the text
 * rather than on top of it. Steps down a little if another note is already
 * there, so a few new notes in a row don't hide each other.
 */
export const placeNewNote = (info: PageInfo, existing: { x: number; y: number }[], width = NEW_NOTE_WIDTH) => {
  const left = info.scrollLeft || 0;
  const x = Math.max(MARGIN + left, left + info.pageWidth - width - MARGIN);
  let y = Math.max(0, info.scrollPosition) + Math.min(TOP_OFFSET, Math.max(MARGIN, info.pageHeight / 6));

  for (let i = 0; i < 12; i++) {
    const taken = existing.some((position) => Math.abs(position.x - x) < CASCADE && Math.abs(position.y - y) < CASCADE);
    if (!taken) break;
    y += CASCADE + 4;
  }
  return { x: Math.round(x), y: Math.round(y) };
};
