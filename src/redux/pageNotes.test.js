import { pagesWithNotes, urlsThatGainedNotes } from "./pageNotes";

const state = (pages) => ({ pages, tags: [], metadata: {} });

test("Lists only pages that have notes", () => {
    expect(pagesWithNotes(state({ "https://a.com/": { notes: [{ id: 1 }] }, "https://b.com/": { notes: [] } }))).toEqual(["https://a.com/"]);
})

test("Finds pages that just got their first note", () => {
    const before = state({ "https://a.com/": { notes: [{ id: 1 }] }, "https://b.com/": { notes: [] } });
    const after = state({
        "https://a.com/": { notes: [{ id: 1 }, { id: 2 }] }, // already had notes
        "https://b.com/": { notes: [{ id: 3 }] }, // first note
        "https://c.com/": { notes: [{ id: 4 }] }, // new page
    });
    expect(urlsThatGainedNotes(before, after)).toEqual(["https://b.com/", "https://c.com/"]);
})

test("Nothing gained when notes are edited or deleted", () => {
    const before = state({ "https://a.com/": { notes: [{ id: 1 }] } });
    expect(urlsThatGainedNotes(before, state({ "https://a.com/": { notes: [{ id: 1, body: "x" }] } }))).toEqual([]);
    expect(urlsThatGainedNotes(before, state({}))).toEqual([]);
})
