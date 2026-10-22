import { canHaveNotes, isExpectedScriptingError, messageWithoutUrls } from "./expectedFailures";
import { browserName } from "./analytics";

test("Knows which pages can't have notes", () => {
    expect(canHaveNotes("https://github.com/")).toBe(true);
    expect(canHaveNotes("file:///C:/notes.html")).toBe(true);
    for (const url of ["chrome://extensions", "edge://settings", "about:blank", "https://chromewebstore.google.com/detail/x", undefined]) {
        expect(canHaveNotes(url)).toBe(false);
    }
})

test("Chrome's harmless scripting errors are expected, others aren't", () => {
    expect(isExpectedScriptingError(new Error("No tab with id: 123."))).toBe(true);
    expect(isExpectedScriptingError(new Error('Cannot access contents of url "https://x.com/". Extension manifest must request permission'))).toBe(true);
    expect(isExpectedScriptingError(new Error("Frame with ID 0 was removed."))).toBe(true);
    expect(isExpectedScriptingError(new Error("Could not establish connection. Receiving end does not exist."))).toBe(true);
    // Edge, reconnecting a YouTube tab after an update (Sentry, 5.0.3)
    expect(isExpectedScriptingError(new Error("Blocked"))).toBe(true);
    // Only that whole message: an error that mentions blocking is still reported
    expect(isExpectedScriptingError(new Error("Blocked a frame with origin from accessing a cross-origin frame."))).toBe(false);
    expect(isExpectedScriptingError(new Error("Cannot read properties of undefined (reading 'notes')"))).toBe(false);
})

test("Error messages sent to Sentry never contain full urls", () => {
    const message = messageWithoutUrls(new Error('Cannot access contents of url "https://bank.com/account?id=1".'));
    expect(message).toBe('Cannot access contents of url "[url]');
    expect(message).not.toContain("bank.com");
})

test("Names the browser from its client hints", () => {
    expect(browserName([{ brand: "Chromium" }, { brand: "Google Chrome" }, { brand: "Not_A Brand" }])).toBe("Google Chrome");
    expect(browserName([{ brand: "Not A(Brand" }, { brand: "Microsoft Edge" }, { brand: "Chromium" }])).toBe("Microsoft Edge");
    expect(browserName([{ brand: "Chromium" }, { brand: "Not/A)Brand" }])).toBe("Chromium");
    expect(browserName(undefined)).toBe("unknown");
})
