import { notesOnPage, pageHasNotes, pagesWithNotes, urlsThatGainedNotes } from "./pageNotes";

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

test("Collects a page's notes from every url they may be saved under, with that url", () => {
    const s = state({
        "https://www.youtube.com/watch?v=abc": { notes: [{ id: "new" }] },
        "https://www.youtube.com/watch": { notes: [{ id: "old" }] },
        "https://www.youtube.com/watch?v=xyz": { notes: [{ id: "other-video" }] },
    });
    const keys = ["https://www.youtube.com/watch?v=abc", "https://www.youtube.com/watch"];
    expect(notesOnPage(s, keys)).toEqual([
        { note: { id: "new" }, pageUrl: "https://www.youtube.com/watch?v=abc" },
        { note: { id: "old" }, pageUrl: "https://www.youtube.com/watch" },
    ]);
    expect(pageHasNotes(s, keys)).toBe(true);
    expect(pageHasNotes(s, ["https://elsewhere.com/"])).toBe(false);
})
