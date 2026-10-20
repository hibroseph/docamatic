// Note and tag colors.
//
// New notes use the design system's six note colors (design-system/tokens.json,
// note-*), saved by name plus their hex values. Notes from before 5.1 keep the
// color they were given: they render with a band in that color across the top
// and plain paper below, like the old title bar. Picking a new color changes
// a note to the new palette; its menu offers the original color back.

export const NOTE_COLOR_NAMES = ["yellow", "pink", "blue", "green", "orange", "purple"] as const;
export type NoteColorName = (typeof NOTE_COLOR_NAMES)[number];

export const DEFAULT_NOTE_COLOR: NoteColorName = "yellow";

// Kept in sync with design-system/tokens.json (checked by colors.test.ts)
export const NOTE_PAPER: Record<NoteColorName, string> = {
  yellow: "#fff1a3",
  pink: "#ffd9ea",
  blue: "#d6ecff",
  green: "#ddf6d8",
  orange: "#ffe2c4",
  purple: "#e9e0ff",
};

export const HIGHLIGHTER: Record<NoteColorName, string> = {
  yellow: "#ffd84d",
  pink: "#ff9ec4",
  blue: "#8fc8ff",
  green: "#9de5a0",
  orange: "#ffb066",
  purple: "#c7b3ff",
};

export const NOTE_INK = "#1e2433";

export const COLOR_LABELS: Record<NoteColorName, string> = {
  yellow: "Yellow",
  pink: "Pink",
  blue: "Blue",
  green: "Green",
  orange: "Orange",
  purple: "Purple",
};

export const isNoteColorName = (value: unknown): value is NoteColorName =>
  typeof value === "string" && (NOTE_COLOR_NAMES as readonly string[]).includes(value);

/** What a new-palette color is saved as. The hex values keep the note readable by any version. */
export const noteColorValue = (name: NoteColorName) => ({ name, title: NOTE_PAPER[name], text: NOTE_INK });

const same = (a?: string, b?: string) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());

export type ResolvedNoteColor =
  | { kind: "palette"; name: NoteColorName }
  | { kind: "legacy"; band: string; bandText: string };

/** How to draw a note's color: a palette paper, or an older note's own color */
export const resolveNoteColor = (color: { name?: string; title?: string; text?: string } | undefined): ResolvedNoteColor => {
  if (color && isNoteColorName(color.name)) return { kind: "palette", name: color.name };
  const byHex = NOTE_COLOR_NAMES.find((name) => same(NOTE_PAPER[name], color?.title));
  if (byHex) return { kind: "palette", name: byHex };
  if (color?.title && /^#[0-9a-f]{3,8}$/i.test(color.title)) {
    return { kind: "legacy", band: color.title, bandText: color.text || contrastingText(color.title) };
  }
  return { kind: "palette", name: DEFAULT_NOTE_COLOR };
};

/** Black or white, whichever reads better on `hex` (the rule older versions used) */
export const contrastingText = (hex: string) => {
  const m = hex.replace("#", "").match(/^([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
  if (!m) return "#000";
  const [r = 0, g = 0, b = 0] = [m[1], m[2], m[3]].map((part) => parseInt(part ?? "0", 16));
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000" : "#fff";
};

// --- Tags -------------------------------------------------------------------

/** The highlighter color a hex tag color is, if any (tags from before 5.1 have their own colors) */
export const tagColorName = (hex: string | undefined): NoteColorName | null =>
  NOTE_COLOR_NAMES.find((name) => same(HIGHLIGHTER[name], hex)) ?? null;

/**
 * The color for a new tag: the highlighter used by the fewest tags, so tags
 * stay easy to tell apart. Each tag keeps its color everywhere.
 */
export const nextTagColor = (tags: { color?: string }[]) => {
  const counts = NOTE_COLOR_NAMES.map((name) => tags.filter((tag) => tagColorName(tag.color) === name).length);
  const fewest = Math.min(...counts);
  return HIGHLIGHTER[NOTE_COLOR_NAMES[counts.indexOf(fewest)] ?? DEFAULT_NOTE_COLOR];
};
