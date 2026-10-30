// Reading notes out of the saved state. Views use these instead of walking
// `state.pages` themselves (see model/types.ts).
import type { Note, NoteRecord, Page, State, Tag } from "./types";
import { isPagePattern, pageKeysFor, patternBase } from "../utils/noteUrl";

const EMPTY: NoteRecord[] = [];

// The flat list is rebuilt only when `pages` changes. Redux keeps unchanged
// objects identical, so this is a cheap cache keyed on the object itself.
const allNotesCache = new WeakMap<object, NoteRecord[]>();

/** Every note, with the url it's saved under */
export const allNotes = (state: Pick<State, "pages"> | undefined): NoteRecord[] => {
  const pages = state?.pages;
  if (!pages) return EMPTY;
  let records = allNotesCache.get(pages);
  if (!records) {
    records = Object.entries(pages).flatMap(([pageUrl, page]) =>
      (page?.notes || []).filter((note) => note?.id != null).map((note) => ({ note, pageUrl }))
    );
    allNotesCache.set(pages, records);
  }
  return records;
};

/** The notes that show on a page (from every url they may be saved under, and patterns covering it) */
export const notesForPage = (state: Pick<State, "pages"> | undefined, href: string | undefined): NoteRecord[] => {
  if (!href) return EMPTY;
  return pageKeysFor(href, state?.pages).flatMap((pageUrl) => (state?.pages?.[pageUrl]?.notes || []).map((note) => ({ note, pageUrl })));
};

export const pageOf = (state: Pick<State, "pages"> | undefined, pageUrl: string): Page | undefined => state?.pages?.[pageUrl];

/**
 * A note's tags. Both sides of the link are saved (Note.tags and Tag.notes)
 * and the reducer keeps them in step; reading either one means a tag still
 * shows if older data only has one side.
 */
export const tagsOfNote = (tags: Tag[] | undefined, note: Note): Tag[] => {
  const ids = new Set((note.tags || []).map((tag) => tag.id));
  return (tags || []).filter((tag) => ids.has(tag.id) || tag.notes?.includes(note.id));
};

/** How many notes each tag is on, by tag id */
export const tagCounts = (state: Pick<State, "pages" | "tags">): Record<string, number> => {
  const counts: Record<string, number> = {};
  const records = allNotes(state);
  for (const tag of state.tags || []) {
    counts[tag.id] = records.filter(({ note }) => tagsOfNote([tag], note).length > 0).length;
  }
  return counts;
};

// --- Text ---------------------------------------------------------------------

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

/**
 * A note body's text without markup, for previews and search. Regex based so
 * it runs anywhere (the background has no DOM); only ever shown as text.
 */
export const plainText = (html: string | null | undefined): string =>
  (html || "")
    .replace(/<(br|\/div|\/p|\/li|\/h\d)\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

// --- Where a note is ------------------------------------------------------------

/** "en.wikipedia.org", without "www." */
export const domainOf = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "file:") return "Files on this computer";
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** The page's title if one was saved, otherwise a readable form of its address */
export const pageLabel = (state: Pick<State, "pages"> | undefined, pageUrl: string): string => {
  // Notes on many pages: "All of facebook.com/marketplace"
  if (isPagePattern(pageUrl)) return `All of ${pageLabel(undefined, patternBase(pageUrl))}`;
  const title = pageOf(state, pageUrl)?.title?.trim();
  if (title) return title;
  try {
    const parsed = new URL(pageUrl);
    const path = decodeURIComponent(parsed.pathname).replace(/\/$/, "");
    return domainOf(pageUrl) + (path && path !== "/" ? path : "");
  } catch {
    return pageUrl;
  }
};

/** When a note last changed (older notes only have their creation date) */
export const lastChanged = (note: Note) => Number(note.updated_at || note.date_created) || 0;

// --- Sorting --------------------------------------------------------------------

export type SortMode = "newest" | "oldest" | "edited" | "site";

export const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  edited: "Recently edited",
  site: "By website",
};

const created = (record: NoteRecord) => Number(record.note.date_created) || 0;

export const sortNotes = (records: NoteRecord[], mode: SortMode): NoteRecord[] => {
  const sorted = [...records];
  switch (mode) {
    case "oldest":
      return sorted.sort((a, b) => created(a) - created(b));
    case "edited":
      return sorted.sort((a, b) => lastChanged(b.note) - lastChanged(a.note));
    case "site":
      return sorted.sort(
        (a, b) => domainOf(a.pageUrl).localeCompare(domainOf(b.pageUrl)) || a.pageUrl.localeCompare(b.pageUrl) || created(b) - created(a)
      );
    case "newest":
    default:
      return sorted.sort((a, b) => created(b) - created(a));
  }
};

export interface PageGroup {
  pageUrl: string;
  records: NoteRecord[];
}

/** Notes grouped by the page they're on, in the order given */
export const groupByPage = (records: NoteRecord[]): PageGroup[] => {
  const groups = new Map<string, PageGroup>();
  for (const record of records) {
    if (!groups.has(record.pageUrl)) groups.set(record.pageUrl, { pageUrl: record.pageUrl, records: [] });
    groups.get(record.pageUrl)!.records.push(record);
  }
  return [...groups.values()];
};
