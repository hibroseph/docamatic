// Reducer cases added in 5.1 (the earlier ones are in reducer.test.js)
import notesApp from "./reducer";
import { fillNoteDetails, showNoteOn } from "./actions";
import {
  addNote,
  addTag,
  addText,
  changeNoteColor,
  deleteTag,
  removeNote,
  restoreNote,
  setPageTitle,
  setPreferences,
  updateTag,
} from "./actions";
import { GetInitialState } from "../utils/GetInitialState";

const URL = "https://x.com/";
const stateWithNote = () => notesApp(GetInitialState(), addNote("note-1", 100, URL));

test("New notes use the new palette, at the position and width they're given", () => {
  const state = notesApp(
    GetInitialState(),
    addNote("n", 0, URL, undefined, { position: { x: 10, y: 20 }, width: 240, color: "blue", pageTitle: "X", visible: false })
  );
  const note = state.pages[URL].notes[0];
  expect(note).toMatchObject({
    position: { x: 10, y: 20 },
    size: { width: 240 },
    color: { name: "blue", title: "#d6ecff", text: "#1e2433" },
    visible: false,
  });
  expect(state.pages[URL].title).toBe("X");
  // Without options: the default color, and the position rule from before
  const plain = stateWithNote().pages[URL].notes[0];
  expect(plain.color.name).toBe("yellow");
  expect(plain.position.y).toBe(100);
});

test("Changing an old note's color remembers the original, which can be picked again", () => {
  let state = {
    ...GetInitialState(),
    pages: { [URL]: { notes: [{ id: "old", position: { x: 1, y: 2 }, size: { width: 225 }, color: { title: "#08597d", text: "#fff" } }] } },
  };
  state = notesApp(state, changeNoteColor("old", URL, "green"));
  expect(state.pages[URL].notes[0].color).toEqual({ name: "green", title: "#ddf6d8", text: "#1e2433", original: "#08597d" });
  expect(state.pages[URL].notes[0].updated_at).toEqual(expect.any(Number));
  state = notesApp(state, changeNoteColor("old", URL, "#08597d"));
  expect(state.pages[URL].notes[0].color).toMatchObject({ title: "#08597d", text: "#fff" });
  expect(state.pages[URL].notes[0].position).toEqual({ x: 1, y: 2 });
});

test("Edits record when they happened", () => {
  const state = notesApp(stateWithNote(), addText("note-1", "hi", URL));
  expect(state.pages[URL].notes[0].updated_at).toEqual(expect.any(Number));
});

test("Tags are matched ignoring case and extra spaces, and new ones get a highlighter color", () => {
  let state = notesApp(stateWithNote(), addNote("note-2", 0, URL));
  state = notesApp(state, addTag("note-1", URL, "Work"));
  state = notesApp(state, addTag("note-2", URL, " work "));
  expect(state.tags).toHaveLength(1);
  expect(state.tags[0]).toMatchObject({ text: "Work", color: "#ffd84d", notes: ["note-1", "note-2"] });
  expect(notesApp(state, addTag("note-1", URL, "   "))).toBe(state);
});

test("A deleted note can be put back with its tags", () => {
  const state = notesApp(stateWithNote(), addTag("note-1", URL, "work"));
  const note = state.pages[URL].notes[0];
  const tags = state.tags.map(({ id, text, color }) => ({ id, text, color }));
  const deleted = notesApp(state, removeNote("note-1", URL));
  expect(deleted.tags).toEqual([]);
  const restored = notesApp(deleted, restoreNote(URL, note, tags));
  expect(restored.pages[URL].notes).toEqual([note]);
  expect(restored.tags).toEqual([{ ...tags[0], notes: ["note-1"] }]);
  // Restoring twice doesn't duplicate it
  expect(notesApp(restored, restoreNote(URL, note, tags))).toBe(restored);
});

test("Renaming a tag, and renaming it to an existing tag merges them", () => {
  let state = notesApp(stateWithNote(), addNote("note-2", 0, URL));
  state = notesApp(state, addTag("note-1", URL, "work"));
  state = notesApp(state, addTag("note-2", URL, "job"));
  const [work, job] = state.tags;
  state = notesApp(state, updateTag(work.id, { text: "office", color: "#c7b3ff" }));
  expect(state.tags[0]).toMatchObject({ id: work.id, text: "office", color: "#c7b3ff" });
  state = notesApp(state, updateTag(job.id, { text: "Office" }));
  expect(state.tags).toEqual([{ id: work.id, text: "office", color: "#c7b3ff", notes: ["note-1", "note-2"] }]);
  expect(state.pages[URL].notes[1].tags).toEqual([{ id: work.id }]);
});

test("Deleting a tag removes it from every note and keeps the notes", () => {
  let state = notesApp(stateWithNote(), addTag("note-1", URL, "work"));
  state = notesApp(state, deleteTag(state.tags[0].id));
  expect(state.tags).toEqual([]);
  expect(state.pages[URL].notes[0].tags).toEqual([]);
  expect(state.pages[URL].notes).toHaveLength(1);
});

test("Page titles are saved only for pages with notes, and only when they change", () => {
  const state = stateWithNote();
  const titled = notesApp(state, setPageTitle(URL, "  Home  "));
  expect(titled.pages[URL].title).toBe("Home");
  expect(notesApp(titled, setPageTitle(URL, "Home"))).toBe(titled);
  expect(notesApp(state, setPageTitle("https://other.com/", "Other"))).toBe(state);
});

test("Preferences are merged, and don't change the saved format", () => {
  let state = notesApp(GetInitialState(), setPreferences({ theme: "dark" }));
  state = notesApp(state, setPreferences({ new_note_color: "pink" }));
  expect(state.metadata.preferences).toEqual({ theme: "dark", new_note_color: "pink" });
  expect(state.metadata.schema_version).toBe(GetInitialState().metadata.schema_version);
});

import { layoutNote, updateNoteSize } from "./actions";

test("Keep on screen: the position switches to the screen, and back to the page", () => {
  let state = notesApp(stateWithNote(), { ...addNote("n", 0, URL), position: { x: 1, y: 2 } });
  state = notesApp(state, { type: "MOVE_NOTE", id: "n", x: 1, y: 2, url: URL, anchor: { kind: "viewport", x: 1, y: 2 } });
  state = notesApp(state, layoutNote("n", URL, { pinned: true, position: { x: 50, y: 60 } }));
  let note = state.pages[URL].notes.find((n) => n.id === "n");
  expect(note).toMatchObject({ stickify: true, position: { x: 50, y: 60 } });
  expect("anchor" in note).toBe(false);
  state = notesApp(state, layoutNote("n", URL, { pinned: false, position: { x: 50, y: 1060 } }));
  note = state.pages[URL].notes.find((n) => n.id === "n");
  expect(note).toMatchObject({ stickify: false, position: { x: 50, y: 1060 } });
});

test("Collapse, and a height that can be set and cleared", () => {
  let state = notesApp(stateWithNote(), layoutNote("note-1", URL, { collapsed: true, height: 180 }));
  expect(state.pages[URL].notes[0]).toMatchObject({ collapsed: true, size: { width: 225, height: 180 } });
  state = notesApp(state, layoutNote("note-1", URL, { height: 10 }));
  expect(state.pages[URL].notes[0].size.height).toBe(60);
  state = notesApp(state, layoutNote("note-1", URL, { height: null }));
  expect(state.pages[URL].notes[0].size).toEqual({ width: 225 });
  // Bad values from a page change nothing
  expect(notesApp(state, layoutNote("note-1", URL, { pinned: true, position: { x: NaN, y: 1 } })).pages[URL].notes[0].stickify).toBe(false);
});

test("A note can start with text (selected on the page), escaped, with its line breaks", () => {
  const state = notesApp(GetInitialState(), addNote("n", 0, URL, undefined, { text: "Line <b>one</b>\nLine two & more" }));
  expect(state.pages[URL].notes[0].body).toBe("Line &lt;b&gt;one&lt;/b&gt;<br>Line two &amp; more");
});

test("Changing a note's width keeps the height it was given", () => {
  let state = notesApp(stateWithNote(), layoutNote("note-1", URL, { height: 180 }));
  state = notesApp(state, updateNoteSize("note-1", 300, URL));
  expect(state.pages[URL].notes[0].size).toEqual({ width: 300, height: 180 });
});

describe("Details older notes didn't save are filled in when known", () => {
  const url = "https://a.com/post";
  const base = { pages: { [url]: { notes: [{ id: "n1", title: "Old" }, { id: "n2", created_on_url: "https://a.com/post?x=1" }] } }, tags: [], metadata: {} };

  test("A missing detail is filled in", () => {
    const next = notesApp(base, fillNoteDetails(url, "n1", { created_on_url: "https://a.com/post?utm=1" }));
    expect(next.pages[url].notes[0]).toEqual({ id: "n1", title: "Old", created_on_url: "https://a.com/post?utm=1" });
  });

  test("Never a detail the note already has, nor an unknown field or a bad value", () => {
    expect(notesApp(base, fillNoteDetails(url, "n2", { created_on_url: "https://a.com/other" }))).toBe(base);
    expect(notesApp(base, fillNoteDetails(url, "n1", { title: "Changed" }))).toBe(base);
    expect(notesApp(base, fillNoteDetails(url, "n1", { created_on_url: "javascript:alert(1)" }))).toBe(base);
    expect(notesApp(base, fillNoteDetails(url, "n1", { created_on_url: "https://evil.com/post" }))).toBe(base);
    expect(notesApp(base, fillNoteDetails(url, "missing", { created_on_url: "https://a.com/post" }))).toBe(base);
  });
});

test("A first-time hint, once put away, stays put away; unknown hints are ignored", () => {
  const { dismissHint } = require("./actions");
  const start = { pages: {}, tags: [], metadata: { onboarded: true, preferences: { theme: "dark" } } };
  const once = notesApp(start, dismissHint("board"));
  expect(once.metadata).toEqual({ onboarded: true, preferences: { theme: "dark" }, hints: { board: true } });
  expect(notesApp(once, dismissHint("board", "used"))).toBe(once);
  expect(notesApp(start, dismissHint("something_else"))).toBe(start);
});

describe("Showing a note on other pages (SHOW_NOTE_ON)", () => {
  const PAGE = "https://www.facebook.com/marketplace/";
  const PATTERN = "https://www.facebook.com/marketplace/*";
  const start = () => ({
    pages: { [PAGE]: { title: "Marketplace", notes: [{ id: "n1", body: "moped", position: { x: 1, y: 2 } }, { id: "n2" }] } },
    tags: [],
    metadata: {},
  });

  test("Moves the note, unchanged, to the new key", () => {
    const state = notesApp(start(), showNoteOn("n1", PAGE, PATTERN));
    expect(state.pages[PAGE].notes.map((n) => n.id)).toEqual(["n2"]);
    expect(state.pages[PAGE].title).toBe("Marketplace");
    expect(state.pages[PATTERN].notes).toEqual([{ id: "n1", body: "moped", position: { x: 1, y: 2 } }]);
  });

  test("And back again", () => {
    const moved = notesApp(start(), showNoteOn("n1", PAGE, PATTERN));
    const back = notesApp(moved, showNoteOn("n1", PATTERN, PAGE));
    expect(back.pages[PAGE].notes.map((n) => n.id)).toEqual(["n2", "n1"]);
    expect(back.pages[PATTERN].notes).toEqual([]);
  });

  test("Never to another site, a non-web address, or for a note that isn't there", () => {
    const state = start();
    expect(notesApp(state, showNoteOn("n1", PAGE, "https://evil.example/*"))).toBe(state);
    expect(notesApp(state, showNoteOn("n1", PAGE, "javascript:alert(1)//*"))).toBe(state);
    expect(notesApp(state, showNoteOn("missing", PAGE, PATTERN))).toBe(state);
    expect(notesApp(state, showNoteOn("n1", PAGE, PAGE))).toBe(state);
  });
});
