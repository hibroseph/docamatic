// Notes shown on more than one page: pattern keys ("…/*") in utils/noteUrl.js
import { addressParts, isPagePattern, pageKeysFor, pageShows, patternMatches, sharedPattern } from "./noteUrl";

const MARKETPLACE = "https://www.facebook.com/marketplace/*";

describe("Patterns", () => {
  test("Only keys ending in /* on a web address are patterns", () => {
    expect(isPagePattern(MARKETPLACE)).toBe(true);
    expect(isPagePattern("https://www.facebook.com/*")).toBe(true);
    expect(isPagePattern("https://www.facebook.com/marketplace/")).toBe(false);
    expect(isPagePattern("https://www.facebook.com/marketplace*")).toBe(false);
    expect(isPagePattern("javascript:alert(1)//*")).toBe(false);
    expect(isPagePattern(undefined)).toBe(false);
  });

  test("Cover every page under them, whatever the query", () => {
    expect(patternMatches(MARKETPLACE, "https://www.facebook.com/marketplace/?ref=bookmark")).toBe(true);
    expect(patternMatches(MARKETPLACE, "https://www.facebook.com/marketplace/portland/search/?query=moped")).toBe(true);
    expect(patternMatches(MARKETPLACE, "https://www.facebook.com/marketplace")).toBe(true);
  });

  test("And nothing else: other folders, look-alike folders, other sites and schemes", () => {
    expect(patternMatches(MARKETPLACE, "https://www.facebook.com/groups/123")).toBe(false);
    expect(patternMatches(MARKETPLACE, "https://www.facebook.com/marketplaces")).toBe(false);
    expect(patternMatches(MARKETPLACE, "https://facebook.com/marketplace/")).toBe(false);
    expect(patternMatches(MARKETPLACE, "http://www.facebook.com/marketplace/")).toBe(false);
    expect(patternMatches(MARKETPLACE, "https://evil.example/www.facebook.com/marketplace/")).toBe(false);
  });

  test("A whole site", () => {
    expect(patternMatches("https://www.facebook.com/*", "https://www.facebook.com/")).toBe(true);
    expect(patternMatches("https://www.facebook.com/*", "https://www.facebook.com/anything/at/all?x=1")).toBe(true);
  });

  test("A page's keys include the patterns that cover it", () => {
    const pages = { [MARKETPLACE]: { notes: [] }, "https://www.facebook.com/groups/*": { notes: [] }, "https://a.com/*": { notes: [] } };
    const keys = pageKeysFor("https://www.facebook.com/marketplace/portland/search/?query=moped", pages);
    expect(keys).toContain(MARKETPLACE);
    expect(keys).toContain("https://www.facebook.com/marketplace/portland/search/?query=moped");
    expect(keys).not.toContain("https://www.facebook.com/groups/*");
    expect(keys).not.toContain("https://a.com/*");
  });

  test("pageShows: a page's own keys and the patterns over it", () => {
    expect(pageShows("https://a.com/post?utm_source=x", "https://a.com/post")).toBe(true);
    expect(pageShows("https://a.com/post/2", "https://a.com/post/*")).toBe(true);
    expect(pageShows("https://a.com/other", "https://a.com/post/*")).toBe(false);
  });
});

describe("The parts of an address (the picker)", () => {
  test("The site, each folder, then the page with its query", () => {
    expect(addressParts("https://www.facebook.com/marketplace/portland/search/?query=moped&utm_source=x")).toEqual([
      { text: "www.facebook.com", key: "https://www.facebook.com/*" },
      { text: "marketplace", key: "https://www.facebook.com/marketplace/*" },
      { text: "portland", key: "https://www.facebook.com/marketplace/portland/*" },
      { text: "search", key: "https://www.facebook.com/marketplace/portland/search/*" },
      { text: "?query=moped", key: "https://www.facebook.com/marketplace/portland/search/?query=moped" },
    ]);
  });

  test("Without a query, every folder is a choice and \"this page\" comes last", () => {
    expect(addressParts("https://www.facebook.com/marketplace/?ref=bookmark")).toEqual([
      { text: "www.facebook.com", key: "https://www.facebook.com/*" },
      { text: "marketplace", key: MARKETPLACE },
      { text: "this page", key: "https://www.facebook.com/marketplace/", page: true },
    ]);
  });

  test("A home page", () => {
    expect(addressParts("https://a.com/")).toEqual([
      { text: "a.com", key: "https://a.com/*" },
      { text: "this page", key: "https://a.com/", page: true },
    ]);
  });

  test("Readable folder names; nothing for pages that aren't web pages", () => {
    expect(addressParts("https://a.com/caf%C3%A9/menu")[1].text).toBe("café");
    expect(addressParts("chrome://extensions")).toEqual([]);
    expect(addressParts("not a url")).toEqual([]);
  });
});

describe("The pages two addresses have in common (Can't find a note?)", () => {
  test("The deepest shared folder", () => {
    expect(sharedPattern("https://www.facebook.com/marketplace/?ref=bookmark", "https://www.facebook.com/marketplace/portland/search/?query=moped")).toBe(
      MARKETPLACE
    );
  });

  test("Just the site when no folder is shared; nothing across sites", () => {
    expect(sharedPattern("https://a.com/x/1", "https://a.com/y/2")).toBe("https://a.com/*");
    expect(sharedPattern("https://a.com/x", "https://b.com/x")).toBeNull();
  });
});
