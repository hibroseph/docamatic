import fs from "fs";
import path from "path";
import { BACKUP_REASONS, addBackup, createBackupEntry, createBackupFile, parseBackupFile } from "./backups";
import { CURRENT_SCHEMA_VERSION } from "./migrations";

const fixture = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, "__fixtures__", file), "utf8"));
const now = new Date("2026-10-19T12:00:00Z");

test("A backup file contains all notes data and nothing else", () => {
    const storage = { ...fixture("storage-schema-v1.json"), backups: [{ big: true }] };
    const file = createBackupFile(storage, { extensionVersion: "5.0.0", now });
    expect(file).toMatchObject({ format: "docamatic-backup", note_count: 2, readable: true, extension_version: "5.0.0" });
    expect(Object.keys(file.storage).sort()).toEqual(["metadata", "pages", "tags"]);
})

test("A backup file can be imported again with every note and tag", () => {
    const storage = fixture("storage-schema-v1.json");
    const text = JSON.stringify(createBackupFile(storage, { extensionVersion: "5.0.0", now }));
    const { state, noteCount } = parseBackupFile(text);
    expect(noteCount).toBe(2);
    expect(state.pages).toEqual(storage.pages);
    expect(state.tags).toEqual(storage.tags);
})

test("Even data in an old format is backed up as is and can be imported", () => {
    const text = JSON.stringify(createBackupFile(fixture("storage-4.0.0.json"), { extensionVersion: "5.0.0", now }));
    expect(parseBackupFile(text).noteCount).toBe(2);
})

test("Imports the older Settings export, which was just the pages", () => {
    const { pages } = fixture("storage-schema-v1.json");
    const { state, noteCount } = parseBackupFile(JSON.stringify(pages));
    expect(noteCount).toBe(2);
    expect(state.metadata.schema_version).toBe(CURRENT_SCHEMA_VERSION);
})

test("Imports a raw dump of extension storage", () => {
    expect(parseBackupFile(JSON.stringify(fixture("storage-schema-v0.json"))).noteCount).toBe(2);
})

test("Explains files it can't import", () => {
    expect(() => parseBackupFile("not json")).toThrow("isn't valid JSON");
    expect(() => parseBackupFile(JSON.stringify({ hello: "world" }))).toThrow("isn't a Docamatic backup");
    expect(() => parseBackupFile(JSON.stringify([1, 2]))).toThrow("isn't a Docamatic backup");
    const future = {
        format: "docamatic-backup",
        storage: { pages: {}, tags: [], metadata: { schema_version: CURRENT_SCHEMA_VERSION + 1 } },
    };
    expect(() => parseBackupFile(JSON.stringify(future))).toThrow("newer version");
})

test("Automatic backups that can't be read are kept, but marked", () => {
    const entry = createBackupEntry({ notes: "{corrupt" }, { reason: BACKUP_REASONS.BEFORE_UPDATE, extensionVersion: "5.0.0", now });
    expect(entry).toMatchObject({ readable: false, note_count: null });
    expect(entry.storage.notes).toBe("{corrupt");
})

test("Keeps the newest few automatic backups for each reason", () => {
    let backups = [];
    for (let day = 1; day <= 5; day++) {
        backups = addBackup(backups, { id: `daily-${day}`, reason: BACKUP_REASONS.DAILY, created_at: `2026-10-0${day}T00:00:00Z` });
    }
    backups = addBackup(backups, { id: "update", reason: BACKUP_REASONS.BEFORE_UPDATE, created_at: "2026-09-01T00:00:00Z" });
    expect(backups.map((b) => b.id)).toEqual(["update", "daily-3", "daily-4", "daily-5"]);
})
