import { decideStoreValue, PENDING_TIMEOUT_MS } from "./useStoreSyncedText";

const now = 100000;
const decide = (overrides) =>
    decideStoreValue({ storeValue: "abc", pendingValue: null, pendingSince: 0, editing: false, now, ...overrides });

test("Applies store values when nothing is being edited (e.g. edited in another tab)", () => {
    expect(decide({})).toEqual({ accept: true, clearPending: false });
})

test("Never overwrites the field while it has focus", () => {
    expect(decide({ editing: true })).toEqual({ accept: false, clearPending: false });
})

test("Ignores an older value echoed back while newer typing is in flight", () => {
    // The user has typed "abcdef"; the store is still echoing "abc" (e.g. the
    // service worker was waking up)
    const result = decide({ storeValue: "abc", pendingValue: "abcdef", pendingSince: now - 200 });
    expect(result).toEqual({ accept: false, clearPending: false });
})

test("Ignores stale echoes even after the field loses focus", () => {
    const result = decide({ storeValue: "abc", pendingValue: "abcdef", pendingSince: now - 200, editing: false });
    expect(result.accept).toBe(false);
})

test("Stops waiting once the store has caught up", () => {
    expect(decide({ storeValue: "abcdef", pendingValue: "abcdef", pendingSince: now - 200, editing: true }))
        .toEqual({ accept: false, clearPending: true });
    expect(decide({ storeValue: "abcdef", pendingValue: "abcdef", pendingSince: now - 200, editing: false }))
        .toEqual({ accept: true, clearPending: true });
})

test("Gives up waiting after the timeout, so the field can't get stuck", () => {
    const result = decide({ storeValue: "xyz", pendingValue: "abcdef", pendingSince: now - PENDING_TIMEOUT_MS - 1 });
    expect(result).toEqual({ accept: true, clearPending: true });
})
