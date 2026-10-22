import { groupBySite, groupNotes, layoutBoard, CARD_WIDTH } from "./board";
import type { NoteRecord, Tag } from "./types";

const note = (id: string, tagIds: string[] = [], pageUrl = "https://x.com/", date_created = 0) =>
  ({ pageUrl, note: { id, date_created, tags: tagIds.map((t) => ({ id: t })) } }) as unknown as NoteRecord;
const tag = (id: string, text: string) => ({ id, text, color: "#fff", notes: [] }) as Tag;
const TAGS = [tag("a", "alpha"), tag("b", "beta"), tag("c", "gamma")];

test("Notes are grouped by their set of tags; notes with several tags sit right after their main tag", () => {
  const groups = groupNotes(
    [note("1", ["a"]), note("2", ["a"]), note("3", ["b"]), note("4", ["b", "a"]), note("5"), note("6", ["c"]), note("7", ["a", "c"])],
    TAGS
  );
  // "alpha" has the most notes (4), so it leads; its combinations follow it
  expect(groups.map((g) => g.key)).toEqual(["a", "a+b", "a+c", "b", "c", "untagged"]);
  expect(groups.find((g) => g.key === "a+b")!.noteIds).toEqual(["4"]);
  expect(groups.at(-1)!.noteIds).toEqual(["5"]);
});

test("A combination without a single-tag group of its own still gets placed", () => {
  expect(groupNotes([note("1", ["b", "c"])], TAGS).map((g) => g.key)).toEqual(["b+c"]);
});

test("Tags that were deleted are ignored", () => {
  expect(groupNotes([note("1", ["gone"]), note("2", ["a", "gone"])], TAGS).map((g) => g.key)).toEqual(["a", "untagged"]);
});

test("The layout puts every note somewhere, groups don't overlap, and rows wrap", () => {
  const records = [...Array(12)].map((_, i) => note(String(i), [["a"], ["b"], ["c"]][i % 3]!));
  const layout = layoutBoard(records, TAGS, 1200);
  expect(Object.keys(layout.positions)).toHaveLength(12);
  const boxes = layout.groups;
  boxes.forEach((g1, i) =>
    boxes.slice(i + 1).forEach((g2) => {
      const apart = g1.x + g1.width <= g2.x || g2.x + g2.width <= g1.x || g1.y + g1.height <= g2.y || g2.y + g2.height <= g1.y;
      expect(apart).toBe(true);
    })
  );
  // Three groups of 4 (2 columns each) don't fit in 1200px side by side
  expect(new Set(boxes.map((g) => g.y)).size).toBeGreaterThan(1);
  expect(layout.width).toBeLessThanOrEqual(1200 + CARD_WIDTH);
});

test("By website: the busiest sites first, each page's notes together, newest page first", () => {
  const groups = groupBySite([
    note("1", [], "https://www.youtube.com/watch?v=a", 1),
    note("2", [], "https://github.com/a/b/pull/1", 5),
    note("3", [], "https://youtube.com/watch?v=b", 9),
    note("4", [], "https://www.youtube.com/watch?v=a", 2),
  ]);
  // www. and the bare domain are one site
  expect(groups.map((g) => [g.site, g.noteIds])).toEqual([
    ["youtube.com", ["3", "1", "4"]],
    ["github.com", ["2"]],
  ]);
});

test("The canvas can be laid out by website", () => {
  const layout = layoutBoard([note("1", ["a"], "https://a.com/x"), note("2", ["a"], "https://b.com/y")], TAGS, 1200, "site");
  expect(layout.groups.map((g) => g.key)).toEqual(["site:a.com", "site:b.com"]);
  expect(Object.keys(layout.positions)).toHaveLength(2);
});
