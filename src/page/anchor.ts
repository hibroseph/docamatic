// What a note on a page moves with when things scroll.
//
// Most notes sit on the page and scroll with it (no anchor, how every note
// before 5.1 works). Web apps often scroll a panel instead of the page
// (Gmail's message list, a docs sidebar, a chat), or have parts that never
// scroll (fixed headers and sidebars). With the "Move notes with scrolling
// panels" setting on, a note dropped over one of those moves the way that
// part does:
//   element:  inside a scrolling panel, or on a sticky part (a sidebar that
//             sticks while the page scrolls); moves with it, and hides once
//             its corner has moved out of it
//   viewport: over something fixed; stays put on screen
// Decided when a note is dropped (or added), from what's under its top left
// corner. note.position always keeps the page coordinates too, as a fallback
// when the panel can't be found, when the setting is off, and for versions
// that don't know anchors.
import type { NoteAnchor } from "../model/types";

/** The point checked under a note: a little inside its top left corner, where it's held */
export const ANCHOR_POINT_OFFSET = 16;

// A note this far over a panel's side edges still counts as inside it
const EDGE_TOLERANCE = 8;

const SCROLLS = /^(auto|scroll|overlay)$/;

const isScrollPanel = (el: Element) => {
  if (el === document.documentElement || el === document.body || el === document.scrollingElement) return false;
  const style = getComputedStyle(el);
  const scrollsY = SCROLLS.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
  const scrollsX = SCROLLS.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1;
  return scrollsY || scrollsX;
};

// Attributes sites keep stable across visits and releases, unlike generated
// class names. Checked in this order at each step up from the element.
const STABLE_ATTRIBUTES = ["data-testid", "data-pagelet", "aria-label", "role", "name"];

// Ids made up per page load or per build (Facebook's "mount_0_0_CN", React's
// ":r3:", hashes) won't be there next time, so they're not used
const isGeneratedId = (id: string) => /\d|:/.test(id) || id.length > 32;

const isUnique = (selector: string) => {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
};

/**
 * A CSS selector that finds this element again after a reload. From the
 * element up, the first step that's unique on the page ends the path: an id,
 * or a stable attribute (aria-label, role, data-testid, ...). Steps without
 * one are tag:nth-of-type. Class names aren't used: many apps generate them
 * per build.
 */
export const selectorFor = (el: Element): string => {
  const steps: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const tag = node.tagName.toLowerCase();
    if (node.id && !isGeneratedId(node.id) && isUnique(`#${CSS.escape(node.id)}`)) {
      steps.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const stable = STABLE_ATTRIBUTES.map((name) => [name, node!.getAttribute(name)] as const)
      .filter(([, value]) => value && value.length <= 100)
      .map(([name, value]) => `${tag}[${name}="${value!.replace(/["\\]/g, "\\$&")}"]`)
      .find(isUnique);
    if (stable) {
      steps.unshift(stable);
      break;
    }
    if (node === document.body) {
      steps.unshift("body");
      break;
    }
    const parent: Element | null = node.parentElement;
    const sameTag = parent ? [...parent.children].filter((child) => child.tagName === node!.tagName) : [];
    steps.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(node) + 1})` : tag);
    node = parent;
  }
  return steps.join(" > ");
};

const widthMatches = (el: Element, width?: number) =>
  !width || Math.abs(el.clientWidth - width) <= Math.max(40, width * 0.3);

/**
 * The anchor's element, if it's on the page. Found by its selector first.
 * Sites that re-render can leave a selector pointing at a different element,
 * so one that's a very different width from when the note was dropped isn't
 * trusted. Sites that generate their markup fresh on every load (Facebook)
 * can leave no usable selector at all; then the panel is looked for where it
 * was: the scrolling (or sticky) element of the same width at the point
 * saved in the anchor. If neither works, the note goes back to where it was
 * dropped on the page, rather than somewhere odd.
 */
export const findAnchorElement = (anchor: Extract<NoteAnchor, { kind: "element" }>): Element | null => {
  let el: Element | null = null;
  try {
    el = document.querySelector(anchor.selector);
  } catch {
    el = null;
  }
  if (el && widthMatches(el, anchor.w)) return el;
  return anchor.hint ? elementAtHint(anchor.hint, anchor.w) : null;
};

const elementAtHint = (hint: NonNullable<Extract<NoteAnchor, { kind: "element" }>["hint"]>, width?: number) => {
  const x = hint.screen ? hint.x : hint.x - window.scrollX;
  const y = hint.screen ? hint.y : hint.y - window.scrollY;
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return null;
  const top = document.elementsFromPoint(x, y).find((el) => el.tagName.toLowerCase() !== "docamatic-notes");
  for (let el: Element | null = top || null; el && el !== document.documentElement; el = el.parentElement) {
    if ((isScrollPanel(el) || getComputedStyle(el).position === "sticky") && widthMatches(el, width)) return el;
  }
  return null;
};

/** The panel's visible area on screen (inside its borders and scrollbars) */
const visibleArea = (el: Element) => {
  const box = el.getBoundingClientRect();
  const left = box.left + el.clientLeft;
  const top = box.top + el.clientTop;
  return { left, top, right: left + el.clientWidth, bottom: top + el.clientHeight };
};

/**
 * How an element moves when the page scrolls:
 *   fixed:  not at all (it or a parent is position: fixed)
 *   sticky: it depends (a sticky parent sticks for part of the scroll)
 *   flow:   with the page
 * Remembered per element: it's asked on every scroll.
 */
export type PanelMode = "fixed" | "sticky" | "flow";
const modeCache = new WeakMap<Element, PanelMode>();
export const panelMode = (el: Element): PanelMode => {
  let mode = modeCache.get(el);
  if (!mode) {
    mode = "flow";
    for (let node: Element | null = el; node && node !== document.documentElement; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === "fixed") {
        mode = "fixed";
        break;
      }
      if (position === "sticky") mode = "sticky";
    }
    modeCache.set(el, mode);
  }
  return mode;
};

const elementAnchor = (el: Element, viewportX: number, viewportY: number): NoteAnchor => {
  const box = el.getBoundingClientRect();
  // A point in the middle of it, to find it again by position (on screen if
  // it doesn't move with the page, on the page otherwise)
  const area = visibleArea(el);
  const screen = panelMode(el) !== "flow";
  const cx = Math.round((area.left + area.right) / 2);
  const cy = Math.round((area.top + area.bottom) / 2);
  return {
    kind: "element",
    selector: selectorFor(el),
    // Within the element's (scrolled) content, from its padding edge
    x: Math.round(viewportX - box.left - el.clientLeft + el.scrollLeft),
    y: Math.round(viewportY - box.top - el.clientTop + el.scrollTop),
    w: el.clientWidth,
    hint: screen ? { x: cx, y: cy, screen } : { x: cx + Math.round(window.scrollX), y: cy + Math.round(window.scrollY), screen },
  };
};

/**
 * What a note whose top left corner is at (viewportX, viewportY) should move
 * with. `ignore` is the notes' own layer, which is on top of everything.
 * A panel only counts when the note fits across it; a note half over a panel
 * and half over something next to it stays on the page.
 */
export const anchorAt = (viewportX: number, viewportY: number, width: number, ignore: Element | null): NoteAnchor | null => {
  const x = viewportX + ANCHOR_POINT_OFFSET;
  const y = viewportY + ANCHOR_POINT_OFFSET;
  const top = document.elementsFromPoint(x, y).find((el) => el !== ignore && !ignore?.contains(el));

  const fitsAcross = (el: Element) => {
    const area = visibleArea(el);
    return viewportX >= area.left - EDGE_TOLERANCE && viewportX + width <= area.right + EDGE_TOLERANCE;
  };

  for (let el: Element | null = top || null; el && el !== document.documentElement; el = el.parentElement) {
    if (isScrollPanel(el) && fitsAcross(el)) return elementAnchor(el, viewportX, viewportY);
    const position = getComputedStyle(el).position;
    if (position === "fixed") return { kind: "viewport", x: Math.round(viewportX), y: Math.round(viewportY) };
    // A sticky part (often a sidebar or header): the note moves with it
    if (position === "sticky" && fitsAcross(el)) return elementAnchor(el, viewportX, viewportY);
  }
  return null;
};

export interface Placement {
  /** Drawn fixed on screen (x/y on screen) rather than on the page (x/y on the page) */
  fixed: boolean;
  x: number;
  y: number;
  /** A note in a panel whose corner has scrolled out of the panel's visible area */
  away?: boolean;
}

/**
 * Where to draw a note right now. A note in a panel is drawn the way its
 * panel moves: on the page if the panel scrolls with the page, fixed on
 * screen otherwise. Then scrolling the page only needs correcting for
 * sticky panels; otherwise only the panel's own scrolling does.
 */
export const placementFor = (position: { x: number; y: number }, anchor: NoteAnchor | undefined, panel?: Element | null): Placement => {
  if (anchor?.kind === "viewport") return { fixed: true, x: anchor.x, y: anchor.y };
  if (anchor?.kind === "element") {
    const el = panel !== undefined ? panel : findAnchorElement(anchor);
    if (el) {
      const area = visibleArea(el);
      const x = area.left + anchor.x - el.scrollLeft;
      const y = area.top + anchor.y - el.scrollTop;
      const cornerX = x + ANCHOR_POINT_OFFSET;
      const cornerY = y + ANCHOR_POINT_OFFSET;
      const away = cornerX < area.left || cornerX > area.right || cornerY < area.top || cornerY > area.bottom;
      return panelMode(el) !== "flow"
        ? { fixed: true, x, y, away }
        : { fixed: false, x: x + window.scrollX, y: y + window.scrollY, away };
    }
  }
  // No anchor, or its panel isn't on the page (yet): where it was dropped
  return { fixed: false, x: position.x, y: position.y };
};
