// What a note on a page moves with when things scroll.
//
// Most notes sit on the page and scroll with it (no anchor, how every note
// before 5.1 works). Web apps often scroll a panel instead of the page
// (Gmail's message list, a docs sidebar, a chat), or have parts that never
// scroll (fixed headers and sidebars). With the "Move notes with scrolling
// panels" setting on, a note dropped over one of those moves the way that
// part does:
//   element:  inside a scrolling panel; scrolls with the panel's content, and
//             hides once its corner has scrolled out of the panel
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

/**
 * A CSS selector that finds this element again after a reload: its id if it
 * has a unique one, otherwise the path of tag:nth-of-type steps from the
 * nearest ancestor with an id (or <body>). Class names aren't used: many apps
 * generate them per build.
 */
export const selectorFor = (el: Element): string => {
  const steps: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    if (node.id && document.querySelectorAll(`#${CSS.escape(node.id)}`).length === 1) {
      steps.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    if (node === document.body) {
      steps.unshift("body");
      break;
    }
    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    const sameTag = parent ? [...parent.children].filter((child) => child.tagName === node!.tagName) : [];
    steps.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(node) + 1})` : tag);
    node = parent;
  }
  return steps.join(" > ");
};

export const findAnchorElement = (selector: string): Element | null => {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
};

/** The panel's visible area on screen (inside its borders and scrollbars) */
const visibleArea = (el: Element) => {
  const box = el.getBoundingClientRect();
  const left = box.left + el.clientLeft;
  const top = box.top + el.clientTop;
  return { left, top, right: left + el.clientWidth, bottom: top + el.clientHeight };
};

// Whether an element is inside something fixed, so it doesn't move when the
// page scrolls. Remembered per element: it's asked on every scroll.
const inFixedCache = new WeakMap<Element, boolean>();
const isInFixed = (el: Element) => {
  let cached = inFixedCache.get(el);
  if (cached === undefined) {
    cached = false;
    for (let node: Element | null = el; node && node !== document.documentElement; node = node.parentElement) {
      if (getComputedStyle(node).position === "fixed") {
        cached = true;
        break;
      }
    }
    inFixedCache.set(el, cached);
  }
  return cached;
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

  for (let el: Element | null = top || null; el && el !== document.documentElement; el = el.parentElement) {
    if (isScrollPanel(el)) {
      const area = visibleArea(el);
      const fits = viewportX >= area.left - EDGE_TOLERANCE && viewportX + width <= area.right + EDGE_TOLERANCE;
      if (!fits) continue;
      const box = el.getBoundingClientRect();
      return {
        kind: "element",
        selector: selectorFor(el),
        // Within the panel's scrolled content, from its padding edge
        x: Math.round(viewportX - box.left - el.clientLeft + el.scrollLeft),
        y: Math.round(viewportY - box.top - el.clientTop + el.scrollTop),
      };
    }
    if (getComputedStyle(el).position === "fixed") {
      return { kind: "viewport", x: Math.round(viewportX), y: Math.round(viewportY) };
    }
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
 * panel moves: fixed on screen if the panel is inside something fixed, on
 * the page otherwise. Then scrolling the page never needs correcting; only
 * the panel's own scrolling does.
 */
export const placementFor = (position: { x: number; y: number }, anchor: NoteAnchor | undefined, panel?: Element | null): Placement => {
  if (anchor?.kind === "viewport") return { fixed: true, x: anchor.x, y: anchor.y };
  if (anchor?.kind === "element") {
    const el = panel !== undefined ? panel : findAnchorElement(anchor.selector);
    if (el) {
      const area = visibleArea(el);
      const x = area.left + anchor.x - el.scrollLeft;
      const y = area.top + anchor.y - el.scrollTop;
      const cornerX = x + ANCHOR_POINT_OFFSET;
      const cornerY = y + ANCHOR_POINT_OFFSET;
      const away = cornerX < area.left || cornerX > area.right || cornerY < area.top || cornerY > area.bottom;
      return isInFixed(el)
        ? { fixed: true, x, y, away }
        : { fixed: false, x: x + window.scrollX, y: y + window.scrollY, away };
    }
  }
  // No anchor, or its panel isn't on the page (yet): where it was dropped
  return { fixed: false, x: position.x, y: position.y };
};
