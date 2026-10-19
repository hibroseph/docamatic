import notesApp from './reducer';
import { addNote, addTag, addText, heartify, importNotes, nukeNotes, removeNote, removeTag, setAnalyticsEnabled, updateNotePosition } from './actions';
import { GetInitialState } from '../utils/GetInitialState';

const URL = "https://x.com/";

const stateWithNote = () => notesApp(GetInitialState(), addNote("note-1", 100, URL));

test("Adds a note to a page that has no notes yet", () => {
    const state = stateWithNote();
    expect(state.pages[URL].notes).toHaveLength(1);
    expect(state.pages[URL].notes[0]).toMatchObject({ id: "note-1", position: { y: 100 }, visible: true });
})

test("Updates a single note without touching the others", () => {
    let state = notesApp(stateWithNote(), addNote("note-2", 0, URL));
    state = notesApp(state, addText("note-2", "hello", URL));
    expect(state.pages[URL].notes[0].body).toBeNull();
    expect(state.pages[URL].notes[1].body).toBe("hello");
})

test("Ignores actions for pages that don't exist instead of throwing", () => {
    const state = stateWithNote();
    expect(notesApp(state, updateNotePosition("note-1", 1, 2, "https://other.com/"))).toBe(state);
    expect(notesApp(state, heartify("note-1", "https://other.com/"))).toBe(state);
})

test("Adds the first tag to a note that has no tags", () => {
    const state = notesApp(stateWithNote(), addTag("note-1", URL, "work"));
    const [tag] = state.tags;
    expect(tag).toMatchObject({ text: "work", notes: ["note-1"] });
    expect(state.pages[URL].notes[0].tags).toEqual([{ id: tag.id }]);
})

test("Reuses an existing tag and removes it once no notes use it", () => {
    let state = notesApp(stateWithNote(), addNote("note-2", 0, URL));
    state = notesApp(state, addTag("note-1", URL, "work"));
    state = notesApp(state, addTag("note-2", URL, "work"));
    expect(state.tags).toHaveLength(1);
    expect(state.tags[0].notes).toEqual(["note-1", "note-2"]);

    const tagId = state.tags[0].id;
    state = notesApp(state, removeTag("note-1", URL, tagId));
    expect(state.tags[0].notes).toEqual(["note-2"]);
    state = notesApp(state, removeNote("note-2", URL));
    expect(state.tags).toEqual([]);
})

test("Import only adds notes that don't already exist", () => {
    const state = stateWithNote();
    const existing = state.pages[URL].notes[0];
    const imported = notesApp(state, importNotes({
        [URL]: { notes: [existing, { id: "note-3" }] },
        "https://new.com/": { notes: [{ id: "note-4" }] },
    }));
    expect(imported.pages[URL].notes.map(n => n.id)).toEqual(["note-1", "note-3"]);
    expect(imported.pages["https://new.com/"].notes.map(n => n.id)).toEqual(["note-4"]);
})

test("Nuke clears notes but remembers the user was onboarded", () => {
    const state = { ...stateWithNote(), metadata: { onboarded: true } };
    expect(notesApp(state, nukeNotes())).toEqual({ pages: {}, tags: [], metadata: { onboarded: true } });
})

test("Turning analytics off is remembered in metadata", () => {
    const state = notesApp(GetInitialState(), setAnalyticsEnabled(false));
    expect(state.metadata.analytics_enabled).toBe(false);
})
