import { GetSafeNoteUrl } from './GetSafeNoteUrl';

test("Removes query strings and fragments", () => {
    expect(GetSafeNoteUrl("https://x.com/home?ref=1#top")).toBe("https://x.com/home");
})

test("Keeps the trailing slash so existing note keys still match", () => {
    expect(GetSafeNoteUrl("https://x.com/")).toBe("https://x.com/");
})

test("Doesn't throw on urls without //", () => {
    expect(GetSafeNoteUrl("about:blank")).toBe("about:blank");
    expect(GetSafeNoteUrl("data:text/html,hi")).toBe("data:text/html,hi");
})

test("Handles missing urls", () => {
    expect(GetSafeNoteUrl(undefined)).toBe(undefined);
})
