import { authorizeSender, reasonToBlock } from './authorizeSender';
import { NUKE_NOTES, MOVE_NOTE, UPDATE_TAG, DELETE_TAG, SET_PREFERENCES, RESTORE_NOTE, SET_PAGE_TITLE, SHOW_NOTE_ON } from './actions';

const EXTENSION_ID = "abc";

beforeAll(() => {
    global.chrome = {
        runtime: {
            id: EXTENSION_ID,
            getURL: (path) => `chrome-extension://${EXTENSION_ID}/${path}`,
        },
    };
});

afterAll(() => {
    delete global.chrome;
});

const run = (action) => {
    const next = vi.fn(() => "passed");
    const result = authorizeSender()(next)(action);
    return { allowed: next.mock.calls.length === 1, result };
};

const popup = { id: EXTENSION_ID, url: `chrome-extension://${EXTENSION_ID}/index.html` };
const contentScriptOn = (url) => ({ id: EXTENSION_ID, url, tab: { id: 1 } });

test("Allows actions dispatched inside the background", () => {
    expect(run({ type: NUKE_NOTES }).allowed).toBe(true);
})

test("Allows any action from extension pages", () => {
    expect(run({ type: NUKE_NOTES, _sender: popup }).allowed).toBe(true);
    expect(run({ type: MOVE_NOTE, url: "https://a.com/", _sender: popup }).allowed).toBe(true);
})

test("Allows content scripts to edit notes on their own page", () => {
    const action = { type: MOVE_NOTE, url: "https://a.com/page", _sender: contentScriptOn("https://a.com/page?x=1#top") };
    expect(run(action).allowed).toBe(true);
})

test("Blocks content scripts from editing another page's notes", () => {
    const action = { type: MOVE_NOTE, url: "https://bank.com/", _sender: contentScriptOn("https://evil.com/") };
    expect(run(action).allowed).toBe(false);
})

test("Blocks privileged actions from content scripts", () => {
    const action = { type: NUKE_NOTES, url: "https://evil.com/", _sender: contentScriptOn("https://evil.com/") };
    expect(run(action).allowed).toBe(false);
})

test("Blocks messages from other extensions", () => {
    const action = { type: MOVE_NOTE, url: "https://a.com/", _sender: { id: "other", url: "https://a.com/" } };
    expect(run(action).allowed).toBe(false);
})

test("Blocks content scripts from sending analytics events or changing settings", () => {
    const sender = contentScriptOn("https://evil.com/");
    expect(run({ type: "TRACK", event: "spam", url: "https://evil.com/", _sender: sender }).allowed).toBe(false);
    expect(run({ type: "SET_ANALYTICS_ENABLED", enabled: true, url: "https://evil.com/", _sender: sender }).allowed).toBe(false);
})

test("Content scripts can edit notes anywhere on their own site", () => {
    const sender = contentScriptOn("https://www.youtube.com/watch?v=abc&t=10s");
    expect(run({ type: MOVE_NOTE, url: "https://www.youtube.com/watch?v=abc", _sender: sender }).allowed).toBe(true);
    // Saved under the old url rules
    expect(run({ type: MOVE_NOTE, url: "https://www.youtube.com/watch", _sender: sender }).allowed).toBe(true);
    // Right after a single page app navigates, before the notes UI has caught up
    expect(run({ type: MOVE_NOTE, url: "https://www.youtube.com/watch?v=previous", _sender: sender }).allowed).toBe(true);
})

test("Content scripts can't edit notes on other sites, even subdomains", () => {
    const sender = contentScriptOn("https://evil.example.com/");
    expect(run({ type: MOVE_NOTE, url: "https://bank.example.com/", _sender: sender }).allowed).toBe(false);
    expect(run({ type: MOVE_NOTE, url: "http://evil.example.com/", _sender: sender }).allowed).toBe(false);
})

test("Local files can edit local-file notes", () => {
    const sender = contentScriptOn("file:///C:/notes/a.html");
    expect(run({ type: MOVE_NOTE, url: "file:///C:/notes/b.html", _sender: sender }).allowed).toBe(true);
    expect(run({ type: MOVE_NOTE, url: "https://a.com/", _sender: sender }).allowed).toBe(false);
})

test("Says why an action was blocked", () => {
    const page = contentScriptOn("https://a.com/");
    expect(reasonToBlock({ type: MOVE_NOTE, url: "https://a.com/" }, { id: "other", url: "https://a.com/" }, EXTENSION_ID)).toBe("other_extension");
    expect(reasonToBlock({ type: NUKE_NOTES }, page, EXTENSION_ID)).toBe("privileged_action");
    expect(reasonToBlock({ type: MOVE_NOTE }, page, EXTENSION_ID)).toBe("no_url");
    expect(reasonToBlock({ type: MOVE_NOTE, url: "https://b.com/" }, page, EXTENSION_ID)).toBe("different_site");
    expect(reasonToBlock({ type: MOVE_NOTE, url: "https://a.com/x" }, page, EXTENSION_ID)).toBeNull();
})

test("Tags and preferences are shared by every site, so only extension pages can change them", () => {
    const page = contentScriptOn("https://a.com/");
    for (const type of [UPDATE_TAG, DELETE_TAG, SET_PREFERENCES]) {
        expect(run({ type, url: "https://a.com/", _sender: page }).allowed).toBe(false);
        expect(run({ type, _sender: popup }).allowed).toBe(true);
    }
    // Putting a deleted note back and saving the page title are edits of the page's own notes
    expect(run({ type: RESTORE_NOTE, url: "https://a.com/x", _sender: page }).allowed).toBe(true);
    expect(run({ type: SET_PAGE_TITLE, url: "https://b.com/", _sender: page }).allowed).toBe(false);
})

test("A page can show its notes on other pages of its own site, not on another site", () => {
    const page = contentScriptOn("https://a.com/x");
    expect(reasonToBlock({ type: SHOW_NOTE_ON, url: "https://a.com/x", to: "https://a.com/*" }, page, EXTENSION_ID)).toBeNull();
    expect(reasonToBlock({ type: SHOW_NOTE_ON, url: "https://a.com/x", to: "https://b.com/*" }, page, EXTENSION_ID)).toBe("different_site");
})
