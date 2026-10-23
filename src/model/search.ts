// Fuzzy search across every note: titles, text, tags and the pages they're on.
// Fuse.js tolerates typos and partial words ("recpie" finds "recipe").
import Fuse from "fuse.js";
import type { NoteRecord, State, Tag } from "./types";
import { allNotes, domainOf, pageLabel, plainText, tagsOfNote } from "./notes";

interface SearchDoc {
  record: NoteRecord;
  title: string;
  text: string;
  tags: string[];
  page: string;
  domain: string;
}

const KEYS = [
  { name: "title", weight: 3 },
  { name: "text", weight: 2 },
  { name: "tags", weight: 2 },
  { name: "page", weight: 1 },
  { name: "domain", weight: 0.5 },
];

// The index is rebuilt only when notes or tags change
let cached: { pages: unknown; tags: unknown; fuse: Fuse<SearchDoc>; docs: SearchDoc[] } | null = null;

const indexFor = (state: Pick<State, "pages" | "tags">) => {
  if (cached && cached.pages === state.pages && cached.tags === state.tags) return cached;
  const docs = allNotes(state).map((record) => ({
    record,
    title: record.note.title || "",
    text: plainText(record.note.body),
    tags: tagsOfNote(state.tags, record.note).map((tag) => tag.text),
    page: pageLabel(state, record.pageUrl),
    domain: domainOf(record.pageUrl),
  }));
  const fuse = new Fuse(docs, {
    keys: KEYS,
    threshold: 0.34,
    // Match anywhere in long notes, not just near the start
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });
  cached = { pages: state.pages, tags: state.tags, fuse, docs };
  return cached;
};

export interface SearchQuery {
  text: string;
  /** Only notes with all of these tags */
  tagIds: string[];
}

export const isEmptyQuery = (query: SearchQuery) => !query.text.trim() && query.tagIds.length === 0;

/** Matching notes, best match first (newest first when only filtering by tag) */
export const searchNotes = (state: Pick<State, "pages" | "tags">, query: SearchQuery): NoteRecord[] => {
  const { fuse, docs } = indexFor(state);
  const text = query.text.trim();
  const selectedTags = (state.tags || []).filter((tag) => query.tagIds.includes(tag.id));
  const hasTags = (record: NoteRecord) =>
    selectedTags.every((tag: Tag) => tagsOfNote([tag], record.note).length > 0);

  const matches = text
    ? matchEveryWord(fuse, text)
    : docs.map((doc) => doc.record).sort((a, b) => Number(b.note.date_created) - Number(a.note.date_created));

  return matches.filter(hasTags);
};

/**
 * Each word is looked for on its own (with typos allowed), and a note
 * matches when every word is found somewhere in it: its title, text, tags or
 * page. Searched as one phrase, "sourdugh starter" found nothing when
 * "starter" was in the note and "sourdough" in its page's title.
 * Best matches first (lowest total Fuse score).
 */
const matchEveryWord = (fuse: Fuse<SearchDoc>, text: string): NoteRecord[] => {
  const words = text.toLowerCase().split(/\s+/).filter((word) => word.length >= 2);
  if (words.length <= 1) return fuse.search(text).map((result) => result.item.record);

  // Total score per note, kept only for notes every word so far was found in
  let scores = new Map<NoteRecord, number>();
  words.forEach((word, i) => {
    const next = new Map<NoteRecord, number>();
    for (const result of fuse.search(word)) {
      const record = result.item.record;
      if (i === 0 || scores.has(record)) next.set(record, (scores.get(record) ?? 0) + (result.score ?? 0));
    }
    scores = next;
  });
  return [...scores].sort((a, b) => a[1] - b[1]).map(([record]) => record);
};
