// Moving a note by its top edge and resizing it from its right edge.
//
// Replaces react-rnd. Its drag library keeps the note's position in React
// state and the pointer's in a plain field; with React 18 the state catches
// up a moment later, so when two pointer moves arrive close together (a fast
// flick, a busy page like Facebook) the second is worked out from the old
// position and the note falls behind the pointer. Here the position lives in
// a ref and goes straight onto the element on every move; React only hears
// about it once, when the note is dropped.
//
// The pointer is captured for the whole drag, so every move comes to the
// note even when the pointer passes over an iframe or a part of the site
// that swallows events.
import React, { useRef, useState } from "react";

// Movement below this is a click on the handle, not a drag
const DRAG_THRESHOLD = 3;
export const MIN_NOTE_WIDTH = 120;
export const MIN_NOTE_HEIGHT = 60;
const KEY_STEP = 8;
const KEY_STEP_LARGE = 40;

// Clicks on these start editing or press a button, never a drag
const NOT_A_HANDLE = "input, button, a, [contenteditable], .menu";

interface Options {
  /** The element that's moved (the note's outer box) */
  boxRef: React.RefObject<HTMLElement>;
  /** Where the note is drawn now: on screen if `fixed`, otherwise on the page */
  position: { x: number; y: number };
  width: number;
  /** A set height, or undefined for as tall as its text */
  height: number | undefined;
  fixed: boolean;
  disabled: boolean;
  onStart: () => void;
  /** A press on the handle that ended without moving */
  onTap?: () => void;
  /** In the same coordinates as `position` */
  onDrop: (x: number, y: number) => void;
  /** height only when the corner was dragged */
  onResize: (width: number, height?: number) => void;
  /** Double-click on the corner: back to as tall as its text */
  onAutoHeight: () => void;
}

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  scrollX: number;
  scrollY: number;
  moved: boolean;
}

export const transformFor = (x: number, y: number) => `translate(${x}px,${y}px)`;

export const useDragResize = ({ boxRef, position, width, height, fixed, disabled, onStart, onTap, onDrop, onResize, onAutoHeight }: Options) => {
  const [dragging, setDragging] = useState(false);
  const drag = useRef<(Gesture & { x: number; y: number; x0: number; y0: number }) | null>(null);
  const resize = useRef<(Gesture & { width0: number; width: number; height0: number; height: number; corner: boolean }) | null>(null);

  // How far the pointer has gone, plus how far the page scrolled meanwhile
  // (a note on the page moves with the page; one fixed on screen doesn't)
  const delta = (gesture: Gesture, event: React.PointerEvent) => ({
    dx: event.clientX - gesture.startX + (fixed ? 0 : window.scrollX - gesture.scrollX),
    dy: event.clientY - gesture.startY + (fixed ? 0 : window.scrollY - gesture.scrollY),
  });

  const begin = (event: React.PointerEvent): Gesture => {
    event.preventDefault(); // no text selection while dragging
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onStart();
    return {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      moved: false,
    };
  };

  const handle = {
    onPointerDown: (event: React.PointerEvent) => {
      if (disabled || event.button !== 0 || (event.target as HTMLElement).closest(NOT_A_HANDLE)) return;
      drag.current = { ...begin(event), x: position.x, y: position.y, x0: position.x, y0: position.y };
    },
    onPointerMove: (event: React.PointerEvent) => {
      const current = drag.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const { dx, dy } = delta(current, event);
      if (!current.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        current.moved = true;
        setDragging(true);
      }
      current.x = current.x0 + dx;
      current.y = current.y0 + dy;
      if (boxRef.current) boxRef.current.style.transform = transformFor(current.x, current.y);
    },
    onPointerUp: (event: React.PointerEvent) => {
      const current = drag.current;
      if (!current || event.pointerId !== current.pointerId) return;
      drag.current = null;
      if (!current.moved) {
        onTap?.();
        return;
      }
      setDragging(false);
      onDrop(Math.round(current.x), Math.round(current.y));
    },
    onPointerCancel: () => {
      // The browser took the pointer (e.g. a touch scroll): put the note back
      if (drag.current?.moved && boxRef.current) boxRef.current.style.transform = transformFor(position.x, position.y);
      drag.current = null;
      setDragging(false);
    },
  };

  // The grip moves the note with the arrow keys too (Shift for bigger steps)
  const onGripKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (disabled || !move) return;
    event.preventDefault();
    onStart();
    onDrop(position.x + move[0], position.y + move[1]);
  };

  // The right edge sets the width; the bottom right corner the height too
  const resizer = (corner: boolean) => ({
    onPointerDown: (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      const startHeight = height ?? boxRef.current?.offsetHeight ?? MIN_NOTE_HEIGHT;
      resize.current = { ...begin(event), width0: width, width, height0: startHeight, height: startHeight, corner };
    },
    onPointerMove: (event: React.PointerEvent) => {
      const current = resize.current;
      if (!current || event.pointerId !== current.pointerId) return;
      current.moved = true;
      current.width = Math.max(MIN_NOTE_WIDTH, current.width0 + event.clientX - current.startX);
      if (boxRef.current) boxRef.current.style.width = `${current.width}px`;
      if (current.corner) {
        current.height = Math.max(MIN_NOTE_HEIGHT, current.height0 + event.clientY - current.startY);
        boxRef.current?.style.setProperty("--note-height", `${current.height}px`);
      }
    },
    onPointerUp: (event: React.PointerEvent) => {
      const current = resize.current;
      if (!current || event.pointerId !== current.pointerId) return;
      resize.current = null;
      if (!current.moved) return;
      if (current.corner) onResize(Math.round(current.width), Math.round(current.height));
      else if (Math.round(current.width) !== width) onResize(Math.round(current.width));
    },
    onPointerCancel: () => {
      if (resize.current && boxRef.current) boxRef.current.style.width = `${width}px`;
      resize.current = null;
    },
  });
  const resizeHandle = resizer(false);
  const cornerHandle = { ...resizer(true), onDoubleClick: onAutoHeight };

  // While dragging, a re-render (another note changed, a panel scrolled)
  // must not snap the note back: draw it where the drag has it
  const drawnAt = drag.current?.moved ? { x: drag.current.x, y: drag.current.y } : position;
  const drawnWidth = resize.current?.moved ? resize.current.width : width;
  const drawnHeight = resize.current?.moved && resize.current.corner ? resize.current.height : height;

  return { dragging, handle, resizeHandle, cornerHandle, onGripKeyDown, drawnAt, drawnWidth, drawnHeight };
};
