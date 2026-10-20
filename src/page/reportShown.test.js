import { reportNewlyShownNotes } from "./reportShown";

const justCreated = [{ note: { id: "n1", date_created: Date.now() }, pageUrl: "https://a.com/" }];

afterEach(() => {
    delete global.chrome;
});

test("Works on a normal website, where extension APIs don't exist (the homepage demo)", () => {
    expect(() => reportNewlyShownNotes(justCreated)).not.toThrow();
    // Chrome defines window.chrome on websites too, just without runtime
    global.chrome = {};
    expect(() => reportNewlyShownNotes(justCreated)).not.toThrow();
})

test("Inside the extension, reports a just-created note once", () => {
    const sendMessage = vi.fn(() => Promise.resolve());
    global.chrome = { runtime: { id: "ext", sendMessage } };
    const notes = [{ note: { id: "n2", date_created: Date.now() }, pageUrl: "https://a.com/" }];
    reportNewlyShownNotes(notes);
    reportNewlyShownNotes(notes);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ type: "note_shown", noteId: "n2" });
})
