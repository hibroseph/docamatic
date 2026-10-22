import fs from "fs";
import path from "path";
import { StateError, isEmptyStorage, noteIdsIn, prepareStoredState, validateState } from "./statePipeline";
import { CURRENT_SCHEMA_VERSION, migrateState } from "./migrations";

const fixture = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, "__fixtures__", file), "utf8"));

const reasonOf = (fn) => {
    try {
        fn();
    } catch (err) {
        expect(err).toBeInstanceOf(StateError);
        return err.reason;
    }
    throw new Error("Expected a StateError");
};

test("Current data loads as is and doesn't need saving", () => {
    const { state, changed, legacyKeys } = prepareStoredState(fixture("storage-schema-v1.json"));
    expect(changed).toBe(false);
    expect(legacyKeys).toEqual([]);
    expect(state.metadata.schema_version).toBe(CURRENT_SCHEMA_VERSION);
})

test("Unversioned data is upgraded and marked for saving", () => {
    const { changed, legacyKeys } = prepareStoredState(fixture("storage-schema-v0.json"));
    expect(changed).toBe(true);
    expect(legacyKeys).toEqual([]);
})

test("The 2022 layout is converted, and its old key is only listed for removal", () => {
    const storage = fixture("storage-4.0.0.json");
    const { state, changed, legacyKeys } = prepareStoredState(storage);
    expect(changed).toBe(true);
    expect(legacyKeys).toEqual(["notes"]);
    expect(noteIdsIn(state).sort()).toEqual(noteIdsIn(storage).sort());
    // The input itself is never modified
    expect(typeof storage.notes).toBe("string");
})

test("Ignores keys that aren't notes data (analytics, backups)", () => {
    const { state } = prepareStoredState({ ...fixture("storage-schema-v1.json"), backups: [{ junk: true }] });
    expect(state.backups).toBeUndefined();
    expect(state.analytics).toBeUndefined();
})

test("Refuses data from a newer version", () => {
    const storage = { pages: {}, tags: [], metadata: { schema_version: CURRENT_SCHEMA_VERSION + 1 } };
    expect(reasonOf(() => prepareStoredState(storage))).toBe("newer_version");
})

test("Refuses a migration that would lose notes", () => {
    const dropFirstPage = (state) => {
        const migrated = migrateState(state);
        return { ...migrated, pages: Object.fromEntries(Object.entries(migrated.pages).slice(1)) };
    };
    const storage = fixture("storage-schema-v0.json");
    expect(reasonOf(() => prepareStoredState(storage, { migrate: dropFirstPage }))).toBe("notes_missing");
})

test("Refuses when a migration throws", () => {
    const broken = () => {
        throw new Error("bug");
    };
    expect(reasonOf(() => prepareStoredState(fixture("storage-schema-v0.json"), { migrate: broken }))).toBe("migration_failed");
})

test("Refuses corrupt older data instead of starting with no notes", () => {
    expect(reasonOf(() => prepareStoredState({ notes: "{not json" }))).toBe("migration_failed");
})

test("Refuses data that isn't in a usable shape", () => {
    expect(reasonOf(() => prepareStoredState({ pages: [{ notes: [{ id: "a" }] }], tags: [], metadata: {} }))).toBe("invalid_state");
    const noteWithoutId = { pages: { "https://a.com/": { notes: [{ title: "no id" }] } }, tags: [], metadata: {} };
    expect(reasonOf(() => validateState(noteWithoutId))).toBe("invalid_state");
})

test("An empty pages array (saved by builds from before this repository) is no notes, not broken data", () => {
    // What storage held on an install that went into safe mode on 5.0.1
    const storage = {
        analytics: { installId: "x" },
        metadata: { docamatic_version: "4.0.0", migrated_data_to_storage_local: true },
        pages: [],
    };
    const { state, changed } = prepareStoredState(storage);
    expect(state.pages).toEqual({});
    expect(state.tags).toEqual([]);
    expect(changed).toBe(true); // saved in the right shape from then on
})

test("Knows a fresh install from existing data", () => {
    expect(isEmptyStorage({})).toBe(true);
    expect(isEmptyStorage({ analytics: { installId: "x" }, backups: [] })).toBe(true);
    expect(isEmptyStorage({ pages: {} })).toBe(false);
    expect(isEmptyStorage({ notes: "{}" })).toBe(false);
})

test("Invalid state errors say what was found, without page urls", () => {
    const messageOf = (state) => {
        try {
            validateState(state);
        } catch (err) {
            return err.message;
        }
    };
    const valid = { pages: { "https://secret.example.com/": { notes: [{ id: 1 }] } }, tags: [], metadata: {} };
    expect(messageOf({ ...valid, pages: "{}" })).toBe("pages is not an object (found string)");
    expect(messageOf({ ...valid, pages: [] })).toBe("pages is not an object (found array)");
    expect(messageOf({ ...valid, tags: {} })).toBe("tags is not an array (found object)");
    expect(messageOf({ ...valid, pages: { "https://secret.example.com/": { notes: "x" } } })).toBe("Page 1 of 1 has no notes array (found string)");
    expect(messageOf({ ...valid, pages: { "https://secret.example.com/": { notes: [{}] } } })).toBe("A note on page 1 of 1 has no id");
});
