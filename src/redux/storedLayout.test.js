import { applyWrite, changedWrite, fullWrite, hasPageKeys, joinPages, pageKey } from "./storedLayout";
import { prepareStoredState } from "./statePipeline";
import { CURRENT_SCHEMA_VERSION } from "./migrations";

const note = (id) => ({ id, title: "t", body: "b", position: { x: 1, y: 2 } });
const A = "https://a.com/";
const B = "https://b.com/x?y=1";

// A stand-in for chrome.storage.local
const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    get: async () => ({ ...data }),
    set: async (items) => Object.assign(data, items),
    remove: async (keys) => keys.forEach((key) => delete data[key]),
  };
};

test("Joining per-page keys gives the familiar { pages } shape", () => {
  const storage = { [pageKey(A)]: { notes: [note("a")] }, [pageKey(B)]: { notes: [note("b")] }, tags: [], metadata: { schema_version: 2 }, backups: [] };
  expect(joinPages(storage)).toEqual({ pages: { [A]: { notes: [note("a")] }, [B]: { notes: [note("b")] } }, tags: [], metadata: { schema_version: 2 }, backups: [] });
});

test("Data in the old layout comes through unchanged", () => {
  const storage = { pages: { [A]: { notes: [note("a")] } }, tags: [], metadata: { schema_version: 1 } };
  expect(joinPages(storage)).toBe(storage);
  expect(hasPageKeys(storage)).toBe(false);
});

test("Saved in this layout with no notes at all: no pages", () => {
  const storage = { tags: [], metadata: { schema_version: 2, onboarded: true } };
  expect(joinPages(storage)).toEqual({ pages: {}, tags: [], metadata: { schema_version: 2, onboarded: true } });
  const reloaded = prepareStoredState(joinPages(storage));
  expect(reloaded.changed).toBe(false);
  expect(reloaded.state.pages).toEqual({});
});

test("An interrupted conversion (both layouts) keeps every page, the per-page copy winning", () => {
  const storage = { pages: { [A]: { notes: [note("old")] }, [B]: { notes: [note("b")] } }, [pageKey(A)]: { notes: [note("new")] } };
  expect(joinPages(storage).pages).toEqual({ [A]: { notes: [note("new")] }, [B]: { notes: [note("b")] } });
});

test("A full save writes every page under its own key and removes the old layout and gone pages", () => {
  const state = { pages: { [A]: { notes: [note("a")] } }, tags: [{ id: "t" }], metadata: { schema_version: 2 } };
  const { set, remove } = fullWrite(state, ["pages", pageKey(A), pageKey(B), "tags", "backups"]);
  expect(set).toEqual({ tags: [{ id: "t" }], metadata: { schema_version: 2 }, [pageKey(A)]: { notes: [note("a")] } });
  expect(remove.sort()).toEqual(["pages", pageKey(B)].sort());
});

test("A save after an edit writes only the page that changed", () => {
  const pageA = { notes: [note("a")] };
  const pageB = { notes: [note("b")] };
  const before = { pages: { [A]: pageA, [B]: pageB }, tags: [], metadata: {} };
  const editedA = { notes: [{ ...note("a"), body: "edited" }] };
  const after = { ...before, pages: { ...before.pages, [A]: editedA } };
  expect(changedWrite(before, after)).toEqual({ set: { [pageKey(A)]: editedA }, remove: [] });
});

test("Removed pages are deleted; changed tags and settings are written", () => {
  const before = { pages: { [A]: { notes: [] }, [B]: { notes: [] } }, tags: [], metadata: {} };
  const after = { pages: { [A]: before.pages[A] }, tags: [{ id: "t" }], metadata: { onboarded: true } };
  expect(changedWrite(before, after)).toEqual({ set: { tags: [{ id: "t" }], metadata: { onboarded: true } }, remove: [pageKey(B)] });
});

test("Nothing saved yet: everything is written", () => {
  const state = { pages: { [A]: { notes: [note("a")] } }, tags: [], metadata: { schema_version: 2 } };
  expect(changedWrite(null, state).set).toEqual({ tags: [], metadata: { schema_version: 2 }, [pageKey(A)]: { notes: [note("a")] } });
});

test("Converting 5.0 data: loads, saves in the new layout, and reads back the same notes", async () => {
  const storage = memoryStorage({
    pages: { [A]: { notes: [note("a1"), note("a2")] }, [B]: { notes: [note("b")] } },
    tags: [{ id: "t", text: "work", notes: ["a1"] }],
    metadata: { onboarded: true, schema_version: 1 },
    backups: [],
  });
  const { state, changed } = prepareStoredState(joinPages(await storage.get()));
  expect(changed).toBe(true);
  expect(state.metadata.schema_version).toBe(CURRENT_SCHEMA_VERSION);

  await applyWrite(storage, fullWrite(state, Object.keys(storage.data)));
  expect(Object.keys(storage.data).sort()).toEqual(["backups", "metadata", pageKey(A), pageKey(B), "tags"].sort());

  const reloaded = prepareStoredState(joinPages(await storage.get()));
  expect(reloaded.changed).toBe(false);
  expect(reloaded.state.pages).toEqual(state.pages);
  expect(reloaded.state.tags).toEqual(state.tags);
});
