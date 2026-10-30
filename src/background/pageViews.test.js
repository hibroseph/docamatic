import { changedPages, pageViewFor, showsAnyOf } from "./pageViews";

const note = (id, extra = {}) => ({ id, title: "t", body: "b", ...extra });
const state = {
  pages: {
    "https://a.com/post": { notes: [note("a1"), note("a2", { tags: [{ id: "t1" }] })], title: "Post" },
    "https://a.com/post/": { notes: [note("a3")] },
    "https://bank.example/account": { notes: [note("secret", { body: "account number 1234" })] },
  },
  tags: [{ id: "t1", text: "work", color: "#fff", notes: ["a2", "secret"] }],
  metadata: { onboarded: true, analytics_enabled: true, schema_version: 1, preferences: { theme: "dark" } },
};

test("A page sees only its own notes (and its trailing-slash twin's)", () => {
  const view = pageViewFor(state, "https://a.com/post?utm_source=x");
  expect(Object.keys(view.pages).sort()).toEqual(["https://a.com/post", "https://a.com/post/"]);
  expect(JSON.stringify(view)).not.toContain("account number");
  expect(JSON.stringify(view)).not.toContain("bank.example");
  expect(JSON.stringify(view)).not.toContain("secret");
});

test("Tags keep their names and colors, but only this page's notes", () => {
  const view = pageViewFor(state, "https://a.com/post");
  expect(view.tags).toEqual([{ id: "t1", text: "work", color: "#fff", notes: ["a2"] }]);
});

test("Only the note settings from metadata", () => {
  expect(pageViewFor(state, "https://a.com/post").metadata).toEqual({ preferences: { theme: "dark" }, safe_mode: undefined, hints: undefined });
});

test("A page without notes sees none", () => {
  expect(pageViewFor(state, "https://other.com/").pages).toEqual({});
  expect(pageViewFor(undefined, "https://other.com/")).toEqual({ pages: {}, tags: [], metadata: { preferences: undefined, safe_mode: undefined, hints: undefined } });
});

test("Which pages a change reaches", () => {
  const edited = { ...state, pages: { ...state.pages, "https://a.com/post": { ...state.pages["https://a.com/post"], title: "New" } } };
  expect(changedPages(state, edited)).toEqual({ all: false, keys: new Set(["https://a.com/post"]) });
  expect(changedPages(state, { ...state, tags: [] }).all).toBe(true);
  expect(changedPages(state, { ...state, metadata: { ...state.metadata, preferences: {} } }).all).toBe(true);
  // Settings pages don't show: no push
  expect(changedPages(state, { ...state, metadata: { ...state.metadata, analytics_enabled: false } })).toEqual({ all: false, keys: new Set() });
  expect(showsAnyOf("https://a.com/post#x", new Set(["https://a.com/post"]))).toBe(true);
  expect(showsAnyOf("https://bank.example/account", new Set(["https://a.com/post"]))).toBe(false);
});

test("Notes saved under a pattern reach every page it covers, and only those", () => {
  const withPattern = { ...state, pages: { ...state.pages, "https://a.com/post/*": { notes: [note("p1")] } } };
  expect(Object.keys(pageViewFor(withPattern, "https://a.com/post/2/comments").pages)).toEqual(["https://a.com/post/*"]);
  expect(pageViewFor(withPattern, "https://a.com/other").pages).toEqual({});
  expect(showsAnyOf("https://a.com/post/2", new Set(["https://a.com/post/*"]))).toBe(true);
  expect(showsAnyOf("https://a.com/other", new Set(["https://a.com/post/*"]))).toBe(false);
});
