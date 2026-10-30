// @vitest-environment jsdom
import { findAnchorElement, placementFor, selectorFor } from "./anchor";
import notesApp from "../redux/reducer";
import { addNote, updateNotePosition } from "../redux/actions";
import { GetInitialState } from "../utils/GetInitialState";

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app">
      <aside></aside>
      <main><section></section><section><div class="list"></div></section></main>
    </div>
    <div id="dup"></div><div id="dup"></div>`;
});

test("Panels are found again by id, or by their path from the nearest id", () => {
  expect(selectorFor(document.getElementById("app")!)).toBe("#app");
  const list = document.querySelector(".list")!;
  const selector = selectorFor(list);
  expect(selector).toBe("#app > main > section:nth-of-type(2) > div");
  expect(findAnchorElement({ kind: "element", selector, x: 0, y: 0 })).toBe(list);
  // Ids that aren't unique aren't trusted
  expect(selectorFor(document.querySelectorAll("#dup")[1]!)).toBe("body > div:nth-of-type(3)");
});

test("A selector that doesn't work finds nothing instead of throwing", () => {
  expect(findAnchorElement({ kind: "element", selector: "div[", x: 0, y: 0 })).toBeNull();
});

test("Ids a site makes up on each load aren't used", () => {
  document.body.innerHTML = `<div id="mount_0_0_CN"><main><div class="list"></div></main></div>`;
  expect(selectorFor(document.querySelector(".list")!)).toBe("body > div > main > div");
});

test("Notes are drawn on the page unless anchored", () => {
  const position = { x: 40, y: 170 };
  expect(placementFor(position, undefined)).toEqual({ fixed: false, x: 40, y: 170 });
  expect(placementFor(position, { kind: "viewport", x: 5, y: 6 })).toEqual({ fixed: true, x: 5, y: 6 });
  // Its panel isn't on the page: where it was dropped
  expect(placementFor(position, { kind: "element", selector: "#missing", x: 1, y: 2 })).toEqual({ fixed: false, x: 40, y: 170 });
});

test("Moving a note sets, keeps or removes its anchor; bad anchors are dropped", () => {
  const URL = "https://x.com/";
  let state = notesApp(GetInitialState(), addNote("n", 0, URL, undefined));
  const note = () => state.pages[URL].notes[0];

  state = notesApp(state, updateNotePosition("n", 10, 20, URL, { kind: "element", selector: "#app > main", x: 3, y: 4 }));
  expect(note().anchor).toEqual({ kind: "element", selector: "#app > main", x: 3, y: 4 });
  expect(note().position).toEqual({ x: 10, y: 20 });

  // Left out: unchanged (older callers)
  state = notesApp(state, updateNotePosition("n", 11, 21, URL, undefined));
  expect(note().anchor).toEqual({ kind: "element", selector: "#app > main", x: 3, y: 4 });

  state = notesApp(state, updateNotePosition("n", 12, 22, URL, null));
  expect("anchor" in note()).toBe(false);

  state = notesApp(state, updateNotePosition("n", 13, 23, URL, { kind: "element", selector: "", x: 1, y: 1 } as never));
  expect("anchor" in note()).toBe(false);
  state = notesApp(state, updateNotePosition("n", 13, 23, URL, { kind: "viewport", x: NaN, y: 1 } as never));
  expect("anchor" in note()).toBe(false);
});
