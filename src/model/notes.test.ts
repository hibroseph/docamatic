import { allNotes, domainOf, groupByPage, notesForPage, pageLabel, plainText, sortNotes, tagCounts, tagsOfNote } from "./notes";
import { searchNotes } from "./search";
import { placeNewNote } from "./placement";
import { friendlyDate } from "./dates";
import type { Note, State } from "./types";

const note = (id: string, extra: Partial<Note> = {}): Note => ({
  id,
  position: { x: 0, y: 0 },
  size: { width: 225 },
  title: null,
  body: null,
  date_created: 1000,
  color: { title: "#fff1a3", text: "#1e2433" },
  ...extra,
});

const state: State = {
  pages: {
    "https://en.wikipedia.org/wiki/Spaced_repetition": {
      title: "Spaced repetition - Wikipedia",
      notes: [
        note("a", {
          title: "Review intervals",
          body: "<div>1 day, 3 days, a&nbsp;week</div><div>Then a month</div>",
          date_created: 3000,
          tags: [{ id: "t1" }],
        }),
      ],
    },
    "https://www.youtube.com/watch?v=abc": {
      notes: [note("b", { body: "Chunking chapter", date_created: 1000, updated_at: 9000, heart: true })],
    },
    "https://cooking.example.com/pasta": { notes: [note("c", { title: "Pasta", body: "Use half the salt", date_created: 2000 })] },
  },
  // Older data may only link one side (tag.notes); both count
  tags: [
    { id: "t1", text: "learning", color: "#ffd84d", notes: ["a", "b"] },
    { id: "t2", text: "food", color: "#ff9ec4", notes: ["c"] },
  ],
  metadata: {},
};

test("Lists every note with the url it's saved under", () => {
  expect(allNotes(state).map((r) => r.note.id)).toEqual(["a", "b", "c"]);
  expect(allNotes(state)).toBe(allNotes(state)); // cached
  expect(notesForPage(state, "https://www.youtube.com/watch?v=abc&t=42s").map((r) => r.note.id)).toEqual(["b"]);
});

test("Tags of a note come from either side of the link", () => {
  const youtubeNote = state.pages["https://www.youtube.com/watch?v=abc"]!.notes[0]!;
  expect(tagsOfNote(state.tags, youtubeNote).map((t) => t.text)).toEqual(["learning"]);
  expect(tagCounts(state)).toEqual({ t1: 2, t2: 1 });
});

test("Plain text from note HTML", () => {
  expect(plainText("<div>1 day, 3 days, a&nbsp;week</div><div>Then a month</div>")).toBe("1 day, 3 days, a week\nThen a month");
  expect(plainText(null)).toBe("");
});

test("Pages are labeled by saved title, else a readable address", () => {
  expect(pageLabel(state, "https://en.wikipedia.org/wiki/Spaced_repetition")).toBe("Spaced repetition - Wikipedia");
  expect(pageLabel(state, "https://cooking.example.com/pasta")).toBe("cooking.example.com/pasta");
  expect(domainOf("https://www.youtube.com/watch?v=abc")).toBe("youtube.com");
});

test("Sorting", () => {
  const ids = (mode: Parameters<typeof sortNotes>[1]) => sortNotes(allNotes(state), mode).map((r) => r.note.id);
  expect(ids("newest")).toEqual(["a", "c", "b"]);
  expect(ids("oldest")).toEqual(["b", "c", "a"]);
  expect(ids("edited")).toEqual(["b", "a", "c"]);
  expect(ids("site")).toEqual(["c", "a", "b"]);
  expect(groupByPage(sortNotes(allNotes(state), "site")).map((g) => g.records.length)).toEqual([1, 1, 1]);
});

test("Fuzzy search finds typos, tags and pages, and filters by tag", () => {
  const ids = (text: string, tagIds: string[] = []) => searchNotes(state, { text, tagIds }).map((r) => r.note.id);
  expect(ids("pasat")).toContain("c");
  expect(ids("intervals")[0]).toBe("a");
  expect(ids("month")).toEqual(["a"]);
  expect(ids("learning")).toEqual(expect.arrayContaining(["a", "b"]));
  expect(ids("wikipedia")).toContain("a");
  expect(ids("", ["t1"])).toEqual(["a", "b"]);
  expect(ids("chunking", ["t2"])).toEqual([]);
  // Several words, each anywhere in the note or its page, typos allowed
  expect(ids("review wikipdia")).toEqual(["a"]);
  expect(ids("pasta salt")).toEqual(["c"]);
  expect(ids("pasta wikipedia")).toEqual([]);
});

test("New notes go near the top right of what's on screen, stepping down past others", () => {
  const info = { scrollPosition: 1000, scrollLeft: 0, pageWidth: 1200, pageHeight: 800 };
  const first = placeNewNote(info, []);
  expect(first).toEqual({ x: 1200 - 240 - 24, y: 1096 });
  const second = placeNewNote(info, [first]);
  expect(second.x).toBe(first.x);
  expect(second.y).toBeGreaterThan(first.y);
  // Narrow windows: never off the left edge
  expect(placeNewNote({ ...info, pageWidth: 200 }, []).x).toBe(24);
});

test("Friendly dates", () => {
  const now = new Date(2026, 9, 20, 15, 0).getTime();
  expect(friendlyDate(now - 10_000, now)).toBe("Just now");
  expect(friendlyDate(now - 5 * 60_000, now)).toBe("5 min ago");
  expect(friendlyDate(new Date(2026, 9, 19, 9).getTime(), now)).toBe("Yesterday");
  expect(friendlyDate(new Date(2026, 9, 17, 9).getTime(), now)).toBe("3 days ago");
  expect(friendlyDate(undefined, now)).toBe("");
});
