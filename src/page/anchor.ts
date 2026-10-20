// What a note on a page moves with when things scroll.
//
// Most notes sit on the page and scroll with it (no anchor, how every note
// before 5.1 works). Web apps often scroll a panel instead of the page
// (Gmail's message list, a docs sidebar, a chat), or have parts that never
// scroll (fixed headers and sidebars). A note dropped over one of those moves
// the way that part does:
//   element:  inside a scrolling panel; scrolls with the panel's content and
//             is cut off at the panel's edges
//   viewport: over something fixed; stays put on screen
// Decided when a note is dropped (or added), from what's under its top left
// corner. note.position always keeps the page coordinates too, as a fallback
// when the panel can't be found and for versions that don't know anchors.
import type { NoteAnchor } from "../model/types";

/** The point checked under a note: a little inside its top left corner, where it's held */
export const ANCHOR_POINT_OFFSET = 16;

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

/**
 * What a note whose top left corner is at (viewportX, viewportY) should move
 * with. `ignore` is the notes' own layer, which is on top of everything.
 */
export const anchorAt = (viewportX: number, viewportY: number, ignore: Element | null): NoteAnchor | null => {
  const x = viewportX + ANCHOR_POINT_OFFSET;
  const y = viewportY + ANCHOR_POINT_OFFSET;
  const top = document.elementsFromPoint(x, y).find((el) => el !== ignore && !ignore?.contains(el));

  for (let el: Element | null = top || null; el && el !== document.documentElement; el = el.parentElement) {
    if (isScrollPanel(el)) {
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
  /** How the note is positioned: page coordinates, or fixed to the screen */
  fixed: boolean;
  x: number;
  y: number;
  /** For notes in a panel: the panel's visible area on screen, to cut the note off at */
  clip?: { left: number; top: number; right: number; bottom: number };
}

/** Where to draw a note right now */
export const placementFor = (position: { x: number; y: number }, anchor: NoteAnchor | undefined): Placement => {
  if (anchor?.kind === "viewport") return { fixed: true, x: anchor.x, y: anchor.y };
  if (anchor?.kind === "element") {
    const el = findAnchorElement(anchor.selector);
    if (el) {
      const box = el.getBoundingClientRect();
      const left = box.left + el.clientLeft;
      const top = box.top + el.clientTop;
      return {
        fixed: false,
        x: left + window.scrollX + anchor.x - el.scrollLeft,
        y: top + window.scrollY + anchor.y - el.scrollTop,
        clip: { left, top, right: left + el.clientWidth, bottom: top + el.clientHeight },
      };
    }
  }
  // No anchor, or its panel isn't on the page (yet): where it was dropped
  return { fixed: false, x: position.x, y: position.y };
};

/**
 * clip-path for a note in a panel, so the parts outside the panel's visible
 * area are hidden (and can't be clicked), like the panel's own content.
 */
export const clipPathFor = (placement: Placement, width: number, height: number): string | undefined => {
  if (!placement.clip) return undefined;
  const left = placement.x - window.scrollX;
  const top = placement.y - window.scrollY;
  const inset = {
    top: Math.max(0, placement.clip.top - top),
    right: Math.max(0, left + width - placement.clip.right),
    bottom: Math.max(0, top + height - placement.clip.bottom),
    left: Math.max(0, placement.clip.left - left),
  };
  if (!inset.top && !inset.right && !inset.bottom && !inset.left) return undefined;
  return `inset(${inset.top}px ${inset.right}px ${inset.bottom}px ${inset.left}px)`;
};
