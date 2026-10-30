import { findLegacyLocalStorageNotes, normalizeState, pagesFromLegacy } from './legacyState';
import notesApp from './reducer';
import { importNotes } from './actions';
import { GetInitialState } from '../utils/GetInitialState';

// Shaped like what the MV2 version (3.1.x) saved: the redux state, keyed by url
const mv2Note = {
    id: "a1",
    position: { x: 10, y: 20 },
    size: { width: 225 },
    body: "remember this",
    title: "todo",
    date_created: 1650000000000,
    color: { title: "#f8ac59", text: "#000" },
    stickify: false,
    heart: true,
};
const mv2State = { "https://example.com/": { notes: [mv2Note] }, "https://empty.com/": { notes: [] } };

test("Finds the background page's notes in the extension's localStorage", () => {
    const entries = {
        "notes-chrome-extension://abc/_generated_background_page.html": JSON.stringify(mv2State),
        "something-else": "x",
    };
    expect(findLegacyLocalStorageNotes(entries)).toBe(JSON.stringify(mv2State));
    expect(findLegacyLocalStorageNotes({})).toBeNull();
})

test("Converts MV2 notes into pages, keeping their contents and skipping empty pages", () => {
    const pages = pagesFromLegacy(JSON.stringify(mv2State));
    expect(Object.keys(pages)).toEqual(["https://example.com/"]);
    expect(pages["https://example.com/"].notes[0]).toMatchObject(mv2Note);
})

test("Fills in fields very old notes are missing", () => {
    const pages = pagesFromLegacy({ "https://a.com/": { notes: [{ id: "old", color: "#08597d", contrastColor: "#fff" }] } });
    expect(pages["https://a.com/"].notes[0]).toMatchObject({
        position: { x: 0, y: 0 },
        size: { width: 225 },
        color: { title: "#08597d", text: "#fff" },
    });
})

test("Importing MV2 notes merges with existing notes and is safe to repeat", () => {
    const pages = pagesFromLegacy(mv2State);
    let state = notesApp(GetInitialState(), importNotes(pages));
    state = notesApp(state, importNotes(pages));
    expect(state.pages["https://example.com/"].notes).toHaveLength(1);
})

test("Converts the early MV3 storage layout", () => {
    const state = normalizeState({ notes: JSON.stringify(mv2State) });
    expect(state.pages["https://example.com/"].notes).toHaveLength(1);
    expect(normalizeState({ notesStorageKey: JSON.stringify(mv2State) }).pages["https://example.com/"]).toBeDefined();
})

test("Leaves the current layout alone", () => {
    const current = { pages: { "https://a.com/": { notes: [mv2Note] } }, tags: [], metadata: { onboarded: true } };
    expect(normalizeState({ ...current, analytics: { installId: "x" } })).toEqual(current);
})

test("Reports corrupt legacy data instead of throwing", () => {
    const onError = vi.fn();
    expect(normalizeState({ notes: "{not json" }, onError).pages).toEqual({});
    expect(onError).toHaveBeenCalled();
})
