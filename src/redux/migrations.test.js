import fs from "fs";
import path from "path";
import { CURRENT_SCHEMA_VERSION, MIGRATION_VERSIONS, migrateState, schemaVersionOf } from "./migrations";
import { normalizeState, pagesFromLegacy } from "./legacyState";
import { noteIdsIn } from "./statePipeline";
import { GetInitialState } from "../utils/GetInitialState";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

// The same steps the background runs on startup (see loadState and
// importLegacyLocalStorage in apps/background/background.js)
const loadFixture = (file) => {
    const data = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), "utf8"));
    if (file.startsWith("mv2-localstorage-")) {
        const pages = pagesFromLegacy(data);
        return { raw: data, state: migrateState({ pages, tags: [], metadata: { schema_version: 0 } }) };
    }
    return { raw: data, state: migrateState(normalizeState(data)) };
};

const noteIdsInState = (state) => Object.values(state.pages).flatMap((page) => page.notes.map((note) => note.id));

test("There is a migration for every schema version", () => {
    const expected = Array.from({ length: CURRENT_SCHEMA_VERSION }, (_, i) => i + 1);
    expect(MIGRATION_VERSIONS.sort((a, b) => a - b)).toEqual(expected);
})

test("A new install starts at the current version and needs no migration", () => {
    const state = GetInitialState();
    expect(schemaVersionOf(state)).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrateState(state)).toBe(state);
})

test("Unversioned data is treated as version 0 and upgraded", () => {
    const v0 = { pages: {}, tags: [], metadata: { onboarded: true } };
    const migrated = migrateState(v0);
    expect(schemaVersionOf(migrated)).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.metadata.onboarded).toBe(true);
})

test("Data from a newer version is left untouched and reported", () => {
    const onNewerVersion = vi.fn();
    const future = { pages: { "https://a.com/": { notes: [{ id: "x", shape: "unknown" }] } }, metadata: { schema_version: CURRENT_SCHEMA_VERSION + 1 } };
    expect(migrateState(future, { onNewerVersion })).toBe(future);
    expect(onNewerVersion).toHaveBeenCalledWith(CURRENT_SCHEMA_VERSION + 1);
})

const fixtures = fs.readdirSync(FIXTURES_DIR).filter((file) => file.endsWith(".json"));

test("There are fixtures to check", () => {
    expect(fixtures.length).toBeGreaterThan(0);
})

describe.each(fixtures)("Saved data in %s", (file) => {
    test("upgrades to the current version", () => {
        expect(schemaVersionOf(loadFixture(file).state)).toBe(CURRENT_SCHEMA_VERSION);
    })

    test("keeps every note", () => {
        const { raw, state } = loadFixture(file);
        // Pages with no notes are dropped, so compare the notes themselves
        expect(noteIdsInState(state).sort()).toEqual(noteIdsIn(raw).sort());
    })

    test("keeps every tag and setting", () => {
        const { raw, state } = loadFixture(file);
        expect(state.tags).toEqual(raw.tags || []);
        const { schema_version, ...settings } = raw.metadata || {};
        expect(state.metadata).toMatchObject(settings);
    })

    test("is unchanged by migrating again", () => {
        const { state } = loadFixture(file);
        expect(migrateState(state)).toEqual(state);
    })
})
