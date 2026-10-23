// The board: every note on one canvas, grouped by tag (entrypoints/board).
//
// Notes are grouped by their exact set of tags. Each tag's own group comes
// first, then the groups of notes that have that tag and others, so notes
// that share tags sit next to each other. Untagged notes come last. Groups
// flow left to right in rows, like words in a paragraph, so they never
// overlap whatever their sizes. Pure functions, so the layout is the same
// every time for the same notes.
import type { NoteRecord, Tag } from "./types";
import { domainOf } from "./notes";

/** What the canvas groups notes by */
export type Grouping = "tag" | "site";

export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 148;
export const GAP = 16;
const GROUP_PADDING = 16;
const GROUP_LABEL = 36;
const MAX_COLUMNS = 3;

export interface BoardGroup {
  /** Stable id: the tag ids joined, "untagged", or "site:" and the website */
  key: string;
  tagIds: string[];
  /** Grouped by website: which one */
  site?: string;
  noteIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardLayout {
  groups: BoardGroup[];
  /** Top left corner of each note's card */
  positions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
}

/** Tags with the most notes first (then by name), so big groups lead */
export const tagOrder = (records: NoteRecord[], tags: Tag[]): Tag[] => {
  const counts = new Map<string, number>();
  records.forEach(({ note }) => (note.tags || []).forEach(({ id }) => counts.set(id, (counts.get(id) || 0) + 1)));
  return tags
    .filter((tag) => counts.has(tag.id))
    .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0) || a.text.localeCompare(b.text));
};

/** Notes grouped by their set of tags, in board order */
export const groupNotes = (records: NoteRecord[], tags: Tag[]): Omit<BoardGroup, "x" | "y" | "width" | "height">[] => {
  const order = tagOrder(records, tags);
  const rank = new Map(order.map((tag, i) => [tag.id, i]));
  const byKey = new Map<string, { tagIds: string[]; noteIds: string[] }>();
  records.forEach(({ note }) => {
    // Tags that no longer exist are left out; duplicates count once
    const tagIds = [...new Set((note.tags || []).map(({ id }) => id).filter((id) => rank.has(id)))].sort(
      (a, b) => rank.get(a)! - rank.get(b)!
    );
    const key = tagIds.length ? tagIds.join("+") : "untagged";
    if (!byKey.has(key)) byKey.set(key, { tagIds, noteIds: [] });
    byKey.get(key)!.noteIds.push(note.id);
  });

  const ordered: string[] = [];
  order.forEach((tag) => {
    if (byKey.has(tag.id)) ordered.push(tag.id);
    // Groups led by this tag (its most-used tag) with other tags, fewest tags first
    [...byKey.entries()]
      .filter(([key, group]) => group.tagIds.length > 1 && group.tagIds[0] === tag.id && !ordered.includes(key))
      .sort(([a, ga], [b, gb]) => ga.tagIds.length - gb.tagIds.length || a.localeCompare(b))
      .forEach(([key]) => ordered.push(key));
  });
  if (byKey.has("untagged")) ordered.push("untagged");
  return ordered.map((key) => ({ key, ...byKey.get(key)! }));
};

/**
 * Notes grouped by website, the sites with the most notes first (then by
 * name). Within a site, a page's notes stay together, newest page first.
 */
export const groupBySite = (records: NoteRecord[]): Omit<BoardGroup, "x" | "y" | "width" | "height">[] => {
  const bySite = new Map<string, NoteRecord[]>();
  records.forEach((record) => {
    const site = domainOf(record.pageUrl);
    if (!bySite.has(site)) bySite.set(site, []);
    bySite.get(site)!.push(record);
  });
  const newest = (list: NoteRecord[]) => Math.max(...list.map(({ note }) => Number(note.date_created) || 0));
  return [...bySite.entries()]
    .sort(([a, la], [b, lb]) => lb.length - la.length || a.localeCompare(b))
    .map(([site, list]) => {
      const byPage = new Map<string, NoteRecord[]>();
      list.forEach((record) => {
        if (!byPage.has(record.pageUrl)) byPage.set(record.pageUrl, []);
        byPage.get(record.pageUrl)!.push(record);
      });
      const noteIds = [...byPage.values()].sort((a, b) => newest(b) - newest(a)).flatMap((page) => page.map(({ note }) => note.id));
      return { key: `site:${site}`, tagIds: [], site, noteIds };
    });
};

/** Where every group and note goes, flowing into rows no wider than `maxWidth` */
export const layoutBoard = (records: NoteRecord[], tags: Tag[], maxWidth: number, grouping: Grouping = "tag"): BoardLayout => {
  const groups: BoardGroup[] = [];
  const positions: BoardLayout["positions"] = {};
  let x = GAP;
  let y = GAP;
  let rowHeight = 0;
  let width = 0;

  (grouping === "site" ? groupBySite(records) : groupNotes(records, tags)).forEach((group) => {
    const columns = Math.min(MAX_COLUMNS, Math.ceil(Math.sqrt(group.noteIds.length)));
    const rows = Math.ceil(group.noteIds.length / columns);
    const groupWidth = GROUP_PADDING * 2 + columns * CARD_WIDTH + (columns - 1) * GAP;
    const groupHeight = GROUP_LABEL + GROUP_PADDING + rows * CARD_HEIGHT + (rows - 1) * GAP;
    // Next row when this group doesn't fit (a row always takes at least one)
    if (x > GAP && x + groupWidth > maxWidth) {
      x = GAP;
      y += rowHeight + GAP * 2;
      rowHeight = 0;
    }
    groups.push({ ...group, x, y, width: groupWidth, height: groupHeight });
    group.noteIds.forEach((id, i) => {
      positions[id] = {
        x: x + GROUP_PADDING + (i % columns) * (CARD_WIDTH + GAP),
        y: y + GROUP_LABEL + Math.floor(i / columns) * (CARD_HEIGHT + GAP),
      };
    });
    x += groupWidth + GAP * 2;
    rowHeight = Math.max(rowHeight, groupHeight);
    width = Math.max(width, x);
  });

  return { groups, positions, width, height: y + rowHeight + GAP };
};
