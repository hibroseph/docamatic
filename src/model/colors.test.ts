import { readFileSync } from "node:fs";
import { HIGHLIGHTER, NOTE_INK, NOTE_PAPER, nextTagColor, resolveNoteColor, tagColorName } from "./colors";

const tokens = JSON.parse(readFileSync(new URL("../../design-system/tokens.json", import.meta.url), "utf8"));
const token = (name: string) => tokens.color.tokens.find((t: { name: string }) => t.name === name)?.value;

test("Note and highlighter colors match the design system", () => {
  for (const [name, hex] of Object.entries(NOTE_PAPER)) expect(token(`note-${name}`)).toBe(hex);
  for (const [name, hex] of Object.entries(HIGHLIGHTER)) expect(token(`hl-${name}`)).toBe(hex);
  expect(token("note-ink")).toBe(NOTE_INK);
});

test("Notes from before 5.1 keep their own color", () => {
  expect(resolveNoteColor({ title: "#08597d", text: "#fff" })).toEqual({ kind: "legacy", band: "#08597d", bandText: "#fff" });
  expect(resolveNoteColor({ title: "#f8ac59" })).toEqual({ kind: "legacy", band: "#f8ac59", bandText: "#000" });
});

test("New palette colors are recognized by name or by their paper hex", () => {
  expect(resolveNoteColor({ name: "blue", title: NOTE_PAPER.blue, text: NOTE_INK })).toEqual({ kind: "palette", name: "blue" });
  expect(resolveNoteColor({ title: NOTE_PAPER.pink.toUpperCase(), text: "#000" })).toEqual({ kind: "palette", name: "pink" });
  // Nothing usable: the default note color rather than a crash
  expect(resolveNoteColor(undefined)).toEqual({ kind: "palette", name: "yellow" });
});

test("New tags get the highlighter fewest tags use", () => {
  expect(nextTagColor([])).toBe(HIGHLIGHTER.yellow);
  expect(nextTagColor([{ color: HIGHLIGHTER.yellow }, { color: "#FF0808" }])).toBe(HIGHLIGHTER.pink);
  expect(tagColorName("#FF0808")).toBeNull();
});
