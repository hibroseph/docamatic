import { knownPreferences, noteStats } from "./diagnostics";

const state = {
  pages: {
    "https://secret-bank.example/account?id=1#top": {
      title: "My private bank page",
      notes: [
        { id: "a", title: "PIN reminder", body: "my secret text", position: { x: -40, y: 10 }, size: { width: 240 }, color: { title: "#fff", text: "#000" }, heart: true, tags: [{ id: "t1" }, { id: "gone" }] },
        { id: "a", title: "", body: "", position: { x: 10, y: -5 }, size: { width: 300, height: 200 }, color: { name: "pink" }, visible: false, collapsed: true },
      ],
    },
    "file:///C:/Users/me/diary.html": { notes: [{ id: "b", body: "dear diary", stickify: true, anchor: { kind: "element" }, created_on_url: "file:///C:/Users/me/diary.html" }] },
    "https://broken.example/": { notes: null },
  },
  tags: [
    { id: "t1", text: "medical", notes: ["a", "zzz"] },
    { id: "t2", text: "unused tag", notes: [] },
  ],
};

test("Counts what helps find a problem", () => {
  const stats = noteStats(state);
  expect(stats.pages).toMatchObject({ count: 3, with_notes: 2, without_notes_array: 1, with_title: 1, addresses_with_query: 1, addresses_with_fragment: 1 });
  expect(stats.pages.address_schemes).toEqual({ https: 2, file: 1 });
  expect(stats.notes).toMatchObject({
    count: 3,
    duplicate_ids: 1,
    with_title: 1,
    empty: 1,
    favorites: 1,
    hidden_from_page: 1,
    collapsed: 1,
    kept_on_screen: 1,
    anchored_to_a_panel: 1,
    with_created_on_url: 1,
    with_height: 1,
  });
  expect(stats.notes.position).toMatchObject({ left_of_page: 1, above_page: 1, missing: 1 });
  expect(stats.notes.colors).toEqual({ named: 1, from_before_5_1: 1, missing: 1 });
  expect(stats.tags).toMatchObject({ count: 2, unused: 1, missing_tag_references: 1, missing_note_references: 1 });
});

test("Nothing written by the person, and no addresses or sites, ever", () => {
  const text = JSON.stringify(noteStats(state));
  for (const secret of ["PIN", "secret", "diary", "bank", "medical", "unused tag", "example", "Users", "account", "pink"]) {
    expect(text).not.toContain(secret);
  }
});

test("Survives broken data", () => {
  expect(noteStats(undefined).notes.count).toBe(0);
  expect(noteStats({ pages: [] as any, tags: "x" as any }).pages.count).toBe(0);
});

test("Only known settings", () => {
  expect(knownPreferences({ theme: "dark", note_text_size: "large", secret: "x" } as any)).toEqual({ theme: "dark", note_text_size: "large" });
  expect(knownPreferences(undefined)).toEqual({});
});
