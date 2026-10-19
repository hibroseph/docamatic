import { authorizeSender } from './authorizeSender';
import { NUKE_NOTES, MOVE_NOTE } from './actions';

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
    const next = jest.fn(() => "passed");
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
