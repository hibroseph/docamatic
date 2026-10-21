// A sticky note on a web page.
//
// Placement is exactly what it has always been: the note's top left corner
// at its saved position (page coordinates, inside a full-page layer at the
// top left of <body>), at its saved width. Only how the note looks changed in
// 5.1, so notes people placed years ago land on the same spot.
//
// Since 5.1, with the "Move notes with scrolling panels" setting on, a note
// dropped over a scrolling panel or a fixed part of the page moves with it
// instead (page/anchor.ts). Notes that were never moved since keep the old
// behavior, and with the setting off every note is on the page.
import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSelector } from "react-redux";
import { PENDING_TIMEOUT_MS } from "../utils/useStoreSyncedText";
import { TEST_IDS } from "../utils/testIds";
import { resolveNoteColor } from "../model/colors";
import type { Note, NoteAnchor, NoteRecord, State, Tag } from "../model/types";
import { anchorAt, findAnchorElement, panelMode, placementFor } from "./anchor";
import { onReveal } from "./reveal";
import { transformFor, useDragResize } from "./useDragResize";
import { useNoteActions } from "../ui/useNoteActions";
import { BodyField, NoteMenu, TagEditor, TitleField, noteColorProps, useDismiss } from "../ui/NoteParts";
import { GripIcon, HeartIcon, MoreIcon } from "../ui/icons";

// Room for the page's vertical scrollbar
const SCROLLBAR_WIDTH = 17;

// Websites listen for keys (YouTube's "k", GitHub's "s", ...). Typing in a
// note must not trigger them, so key events stop at the note.
const stop = (event: React.SyntheticEvent) => event.stopPropagation();

/** The notes' layer on the page (the shadow root's host), left out when checking what's under a note */
const layerOf = (el: Element | null) => ((el?.getRootNode() as ShadowRoot | undefined)?.host as Element) || null;

/** The "Move notes with scrolling panels" setting (off unless turned on) */
export const useFollowPanels = () => useSelector((state: State) => state.metadata?.preferences?.follow_panels === true);

/**
 * Where a note is drawn. A note in a panel is redrawn from the panel's own
 * scroll events, synchronously, so it moves in the same frame as the panel's
 * content instead of trailing it. Page scrolling needs nothing (placementFor
 * draws it the way its panel moves). Other notes never change here.
 */
const usePlacement = (note: Note, anchor: NoteAnchor | undefined) => {
  const elementAnchor = anchor?.kind === "element" ? anchor : undefined;
  // Identifies the anchor; the effect below starts over when it changes
  const key = elementAnchor ? JSON.stringify(elementAnchor) : "";
  const [panel, setPanel] = useState<Element | null>(() => (elementAnchor ? findAnchorElement(elementAnchor) : null));
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!elementAnchor) return;
    const redraw = () => flushSync(() => setTick((n) => n + 1));
    let current: Element | null = null;
    // A sticky panel moves differently from the page while it scrolls, so
    // page scrolling needs a redraw too; fixed and in-page panels don't
    const attach = (el: Element | null) => {
      current?.removeEventListener("scroll", redraw);
      window.removeEventListener("scroll", redraw);
      current = el;
      current?.addEventListener("scroll", redraw, { passive: true });
      if (current && panelMode(current) === "sticky") window.addEventListener("scroll", redraw, { passive: true });
      setPanel(current);
    };
    attach(findAnchorElement(elementAnchor));
    window.addEventListener("resize", redraw);
    // Single page apps render panels late, or replace them; look again now
    // and then, and redraw only when something actually changed
    let last = placementFor(note.position, anchor, current);
    const check = setInterval(() => {
      // The same element if it's still there; looked up again only when it's gone
      const found = current?.isConnected ? current : findAnchorElement(elementAnchor);
      if (found !== current) attach(found);
      const now = placementFor(note.position, anchor, current);
      if (now.fixed !== last.fixed || Math.abs(now.x - last.x) > 0.5 || Math.abs(now.y - last.y) > 0.5 || now.away !== last.away) {
        last = now;
        setTick((n) => n + 1);
      }
    }, 500);
    return () => {
      attach(null);
      window.removeEventListener("resize", redraw);
      clearInterval(check);
    };
  }, [key]);

  return { placement: placementFor(note.position, anchor, elementAnchor ? panel : undefined), panel };
};

interface Props {
  record: NoteRecord;
  tags: Tag[];
  windowWidth: number;
  zIndex: number;
  onBringToFront: () => void;
  disconnected: boolean;
  autoFocus: boolean;
}

export const StickyNote = ({ record, tags, windowWidth, zIndex, onBringToFront, disconnected, autoFocus }: Props) => {
  const { note } = record;
  const actions = useNoteActions(record);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  useDismiss(menuOpen, () => setMenuOpen(false), menuRef, moreRef);

  // The saved position comes back from the background store a moment after
  // a drag ends, so without this the note would snap back to its old spot
  // until then. The dropped
  // position is used until the store has caught up with it (or it's been a
  // while, so a move made in another tab still comes through). Same idea as
  // useStoreSyncedText for typing.
  const [dropped, setDropped] = useState<{ x: number; y: number; at: number } | null>(null);
  const [resized, setResized] = useState<{ width: number; at: number } | null>(null);

  useEffect(() => {
    if (!dropped) return;
    const caughtUp = note.position.x === dropped.x && note.position.y === dropped.y;
    if (caughtUp || Date.now() - dropped.at > PENDING_TIMEOUT_MS) setDropped(null);
  }, [note.position.x, note.position.y]);

  useEffect(() => {
    if (!resized) return;
    if (note.size.width === resized.width || Date.now() - resized.at > PENDING_TIMEOUT_MS) setResized(null);
  }, [note.size.width]);

  const followPanels = useFollowPanels();
  const anchor = followPanels ? note.anchor : undefined;
  const { placement: anchored, panel } = usePlacement(note, anchor);
  // Just dropped: where it was dropped, on the page, until the store has it
  const placement = dropped ? { fixed: false, x: dropped.x, y: dropped.y, away: false } : anchored;
  const position = placement;
  const width = resized ? resized.width : note.size.width;

  // Keep notes saved on a wider window from ending up off screen (notes on
  // the page only, as always; anchored ones go where their panel is)
  const isOffScreen = !anchor && !dropped && position.x + width > windowWidth - SCROLLBAR_WIDTH;
  const fixed = Boolean(note.stickify) || placement.fixed;
  const shownAt = { x: isOffScreen ? windowWidth - width - SCROLLBAR_WIDTH : position.x, y: position.y };

  const { dragging, handle, resizeHandle, onGripKeyDown, drawnAt, drawnWidth } = useDragResize({
    boxRef,
    position: shownAt,
    width,
    fixed,
    disabled: Boolean(note.stickify),
    onStart: onBringToFront,
    onDrop: (x, y) => {
      // Where it is on screen now decides what it moves with from here on.
      // Kept on screen: all of it if it fits, otherwise its top.
      const onScreen = (value: number, size: number, room: number) => Math.min(Math.max(0, value), Math.max(0, room - size));
      const height = articleRef.current?.offsetHeight || 40;
      const screenX = onScreen(fixed ? x : x - window.scrollX, width, window.innerWidth - SCROLLBAR_WIDTH);
      const screenY = onScreen(fixed ? y : y - window.scrollY, Math.min(height, window.innerHeight), window.innerHeight);
      const pageX = Math.round(screenX + window.scrollX);
      const pageY = Math.round(screenY + window.scrollY);
      setDropped({ x: pageX, y: pageY, at: Date.now() });
      // With the setting off, a moved note is on the page (its anchor, if any, is cleared)
      const found = followPanels ? anchorAt(screenX, screenY, width, layerOf(articleRef.current)) : null;
      actions.move(pageX, pageY, note.stickify ? undefined : found);
    },
    onResize: (newWidth) => {
      setResized({ width: newWidth, at: Date.now() });
      actions.resize(newWidth);
    },
  });

  // A note in a panel whose corner has scrolled out of the panel goes away
  // whole, rather than showing half of it over whatever is next to the panel
  const away = Boolean(placement.away) && !menuOpen && !dragging;

  // A note just added over a scrolling panel or a fixed part of the page
  // moves with it from the start
  useEffect(() => {
    if (!autoFocus || note.anchor || !followPanels) return;
    const frame = requestAnimationFrame(() => {
      const found = anchorAt(
        note.position.x - window.scrollX,
        note.position.y - window.scrollY,
        note.size.width,
        layerOf(articleRef.current)
      );
      if (found) actions.move(note.position.x, note.position.y, found);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // "Find on page" from the popup or side panel (page/reveal.ts)
  const [found, setFound] = useState(false);
  useEffect(
    () =>
      onReveal(note.id, () => {
        onBringToFront();
        const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        if (anchor?.kind === "element" && !panel) {
          // Its panel isn't on the page any more: back onto the page, where it was dropped
          actions.move(note.position.x, note.position.y, null);
        }
        if (anchor?.kind === "element" && panel) {
          // Scroll the panel to the note, then the page to the panel
          panel.scrollTo({ top: Math.max(0, anchor.y - 40), left: Math.max(0, anchor.x - 40), behavior });
          panel.scrollIntoView({ block: "nearest", behavior });
        } else if (anchor?.kind === "viewport") {
          // Always on screen, unless the window got smaller since: bring it back in
          const x = Math.min(Math.max(0, anchor.x), Math.max(0, window.innerWidth - width - SCROLLBAR_WIDTH));
          const y = Math.min(Math.max(0, anchor.y), Math.max(0, window.innerHeight - 80));
          if (x !== anchor.x || y !== anchor.y) actions.move(x + window.scrollX, y + window.scrollY, { kind: "viewport", x, y });
        } else {
          window.scrollTo({ top: Math.max(0, note.position.y - 120), behavior });
        }
        setFound(true);
        setTimeout(() => setFound(false), 2400);
      }),
    [note.id, anchor, panel, note.position.x, note.position.y, width]
  );

  const color = noteColorProps(resolveNoteColor(note.color));

  return (
    <div
      ref={boxRef}
      className="note-box"
      style={{
        // Same positioning react-rnd used before 5.1 (top left of the notes'
        // layer, then translated), so notes land exactly where they always have
        position: fixed ? "fixed" : "absolute",
        top: 0,
        left: 0,
        transform: transformFor(drawnAt.x, drawnAt.y),
        width: drawnWidth,
        zIndex,
        visibility: away ? "hidden" : undefined,
      }}
    >
      <article
        ref={articleRef}
        className={`dm-note note note--page ${color.className} ${dragging ? "is-dragging" : ""} ${menuOpen ? "has-menu" : ""} ${found ? "is-found" : ""}`}
        style={color.style}
        data-testid={TEST_IDS.note}
        data-note-id={note.id}
        aria-label={note.title ? `Note: ${note.title}` : "Note"}
        onPointerDown={onBringToFront}
        onKeyDown={stop}
        onKeyUp={stop}
        onKeyPress={stop}
        onBeforeInput={stop}
      >
        <div className="dm-note__head note__head note__drag" {...handle}>
          <span
            className="dm-note__grip"
            data-testid={TEST_IDS.noteDragHandle}
            title="Drag to move, or use the arrow keys"
            role="button"
            tabIndex={0}
            aria-label="Move note (arrow keys)"
            onKeyDown={onGripKeyDown}
          >
            <GripIcon />
          </span>
          <TitleField note={note} actions={actions} className="dm-note__title" />
          <div className="dm-note__actions">
            <button
              type="button"
              className="dm-note__action"
              aria-label={note.heart ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={Boolean(note.heart)}
              data-testid={TEST_IDS.noteFavorite}
              onClick={actions.toggleFavorite}
            >
              <HeartIcon filled={note.heart} />
            </button>
            <button
              type="button"
              ref={moreRef}
              className="dm-note__action"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreIcon />
            </button>
          </div>
        </div>
        {disconnected && (
          <div className="note__sync-error" role="alert" data-testid={TEST_IDS.noteSyncError}>
            <strong>Docamatic was updated</strong>
            <span>Reload the page to keep editing this note.</span>
            <button type="button" className="dm-btn dm-btn--sm" onClick={() => document.location.reload()}>
              Reload page
            </button>
          </div>
        )}
        <BodyField note={note} actions={actions} className="dm-note__body" autoFocus={autoFocus} />
        <TagEditor tags={tags} actions={actions} adding={addingTag} onDoneAdding={() => setAddingTag(false)} />
        <NoteMenu ref={menuRef} open={menuOpen} record={record} actions={actions} onDone={() => setMenuOpen(false)} onAddTag={() => setAddingTag(true)} />
      </article>
      {!note.stickify && <div className="note__resize" aria-hidden="true" {...resizeHandle} />}
    </div>
  );
};
