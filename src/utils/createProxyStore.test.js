import { FETCH_STATE_TYPE } from "webext-redux/lib/constants";
import { createProxyStore } from "./createProxyStore";

// A fake chrome.runtime where the background answers state requests with
// whatever `backgroundState` currently is
let backgroundState;
beforeEach(() => {
    // webext-redux finds the extension API as self.chrome, like in a browser
    global.self = global;
    backgroundState = { pages: { "https://a.com/": { notes: [{ id: "1" }] } }, tags: [], metadata: {} };
    const reply = (message) => ({ type: FETCH_STATE_TYPE, payload: backgroundState, channelName: message.channelName });
    global.chrome = {
        runtime: {
            id: "test-extension",
            onMessage: { addListener: vi.fn() },
            sendMessage: vi.fn((message, options, callback) => {
                if (typeof callback === "function") {
                    // Chrome always replies asynchronously
                    setTimeout(() => callback(reply(message)), 0);
                    return undefined;
                }
                return Promise.resolve(reply(message));
            }),
        },
    };
});

afterEach(() => {
    delete global.chrome;
    delete global.self;
});

test("Resync replaces outdated state with the background's and notifies the UI", async () => {
    const store = createProxyStore();
    await store.ready();
    expect(store.getState().pages["https://a.com/"].notes).toHaveLength(1);

    // While the page was in the back/forward cache, a note was added elsewhere
    backgroundState = { ...backgroundState, pages: { "https://a.com/": { notes: [{ id: "1" }, { id: "2" }] } } };
    const listener = vi.fn();
    store.subscribe(listener);

    await store.resync();

    expect(store.getState().pages["https://a.com/"].notes).toHaveLength(2);
    expect(listener).toHaveBeenCalled();
})

test("Resync doesn't throw when the extension has gone away", async () => {
    const store = createProxyStore();
    await store.ready();
    chrome.runtime.sendMessage = vi.fn(() => Promise.reject(new Error("Extension context invalidated.")));
    await expect(store.resync()).resolves.toBeUndefined();
})
