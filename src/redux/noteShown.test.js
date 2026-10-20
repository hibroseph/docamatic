import { NEW_NOTE_WINDOW_MS, noteShownEvent } from "./noteShown";

const now = 1_800_000_000_000;
const state = {
    pages: {
        "https://github.com/a/issues/1": { notes: [{ id: "new", date_created: now - 3000 }, { id: "old", date_created: now - NEW_NOTE_WINDOW_MS - 1 }] },
        "https://bank.com/": { notes: [{ id: "bank", date_created: now - 1000 }] },
    },
    tags: [],
    metadata: {},
};
const report = (overrides) =>
    noteShownEvent({ state, noteId: "new", senderUrl: "https://github.com/a/issues/1", now, alreadyReported: new Set(), ...overrides });

test("Counts a just-created note shown on its own site", () => {
    expect(report({})).toEqual({ note_id: "new", ms_since_created: 3000 });
})

test("Also when the tab's url moved on within the same site", () => {
    expect(report({ senderUrl: "https://github.com/a/issues/2" })).not.toBeNull();
})

test("Ignores old notes (just a page being revisited)", () => {
    expect(report({ noteId: "old" })).toBeNull();
})

test("Ignores notes that don't exist or were already counted", () => {
    expect(report({ noteId: "made-up" })).toBeNull();
    expect(report({ alreadyReported: new Set(["new"]) })).toBeNull();
})

test("A page can't report another site's notes", () => {
    expect(report({ noteId: "bank", senderUrl: "https://evil.com/" })).toBeNull();
})
