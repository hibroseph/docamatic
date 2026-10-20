import fs from "fs";
import path from "path";
import { describeNotesValue, describeStorage, storageSizes } from "./storageShape";

const FIXTURES = path.join(__dirname, "__fixtures__");
const fixture = (file) => JSON.parse(fs.readFileSync(path.join(FIXTURES, file), "utf8"));
const fixtureFiles = fs.readdirSync(FIXTURES).filter((file) => file.endsWith(".json"));

// Every string value anywhere in the data, including inside the JSON strings
// older versions saved: urls are keys, so they're collected too
const userStrings = (value) => {
  if (typeof value === "string") {
    try {
      return [value, ...userStrings(JSON.parse(value))];
    } catch {
      return [value];
    }
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [...(Array.isArray(value) ? [] : [key]), ...userStrings(child)]);
};

// Key names the extension itself writes; the only strings allowed through
const EXTENSION_KEYS = new Set(["pages", "tags", "metadata", "notes", "notesStorageKey", "analytics", "backups", "legacyLocalStorageImported", "lifecycle", "onboarded", "schema_version", "analytics_enabled", "user", "errors", "tracking", "canTrack", "trackingTime", "installId", "lastDailyActive", "id", "title", "body", "color", "text", "position", "size", "width", "x", "y", "heart", "stickify", "date_created", "visible", "created_on_url", "contrastColor", "safe_mode"]);

test.each(fixtureFiles)("Never includes urls, note text, tags or ids (%s)", (file) => {
  const data = fixture(file);
  const storage = file.startsWith("mv2-localstorage") ? { notes: JSON.stringify(data) } : data;
  const described = JSON.stringify({ ...describeStorage(storage), ...storageSizes(storage) });

  userStrings(storage)
    .filter((s) => s.length >= 3 && !EXTENSION_KEYS.has(s) && !/^\d+$/.test(s))
    .forEach((s) => expect(described).not.toContain(s));
});

test("Describes current data", () => {
  const shape = describeStorage(fixture("storage-schema-v1.json"));
  expect(shape["pages.type"]).toBe("object");
  expect(shape["pages.page_count"]).toBeGreaterThan(0);
  expect(shape["tags.type"]).toBe("array");
  expect(shape["metadata.schema_version"]).toBe(1);
  expect(shape["notes_found_anywhere"]).toBeGreaterThan(0);
  expect(shape["storage.keys"]).toContain("pages");
});

// The shapes that put 5.0.0 users in safe mode with "pages is not an object"
test.each([
  ["a JSON string", (pages) => JSON.stringify(pages), { "pages.type": "string", "pages.json.type": "object" }],
  ["an array", (pages) => Object.values(pages), { "pages.type": "array", "pages.length": 2, "pages.item_types.object": 2 }],
  ["a number", () => 5, { "pages.type": "number", "pages.value": 5 }],
  ["true", () => true, { "pages.type": "boolean", "pages.value": true }],
])("Describes pages saved as %s", (_, toBadPages, expected) => {
  const storage = fixture("storage-schema-v1.json");
  storage.pages = toBadPages(storage.pages);
  expect(describeStorage(storage)).toMatchObject(expected);
});

test("Counts notes inside a pages JSON string", () => {
  const storage = fixture("storage-schema-v1.json");
  const pageCount = Object.keys(storage.pages).length;
  storage.pages = JSON.stringify(storage.pages);
  const shape = describeStorage(storage);
  expect(shape["pages.json.page_count"]).toBe(pageCount);
  expect(shape["notes_found_anywhere"]).toBeGreaterThan(0);
});

test("Counts url keys at the top level instead of naming them", () => {
  const shape = describeStorage({ pages: {}, "https://example.com/": { notes: [] }, "example.org/page": {} });
  expect(shape["storage.url_key_count"]).toBe(2);
  expect(shape["storage.keys"]).toBe("pages");
  expect(JSON.stringify(shape)).not.toContain("example");
});

test("Says which notes keys are missing", () => {
  expect(describeStorage({ analytics: {} })).toMatchObject({ "pages.type": "missing", "tags.type": "missing", "metadata.type": "missing", notes_found_anywhere: 0 });
  expect(describeStorage({ metadata: {} })["metadata.schema_version"]).toBe("missing");
});

test("Describes old format notes, and invalid JSON", () => {
  expect(describeNotesValue(JSON.stringify(fixture("mv2-localstorage-3.1.3.json")))).toMatchObject({ "old_notes.type": "string", "old_notes.json.type": "object" });
  expect(describeNotesValue("{not json")).toMatchObject({ "old_notes.json": "invalid" });
  expect(describeNotesValue(null)).toMatchObject({ "old_notes.type": "null" });
});

test("Never throws", () => {
  expect(describeStorage(null)).toEqual({ "storage.type": "null" });
  const hostile = { get pages() { throw new Error("boom"); } };
  expect(describeStorage(hostile).describe_error).toBe("boom");
});
