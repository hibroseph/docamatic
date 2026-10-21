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
import { Rnd } from "react-rnd";
import { PENDING_TIMEOUT_MS } from "../utils/useStoreSyncedText";
import { TEST_IDS } from "../utils/testIds";
import { resolveNoteColor } from "../model/colors";
import type { Note, NoteAnchor, NoteRecord, State, Tag } from "../model/types";
import { anchorAt, findAnchorElement, placementFor } from "./anchor";
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
  const [panel, setPanel] = useState<Element | null>(() =>
    anchor?.kind === "element" ? findAnchorElement(anchor.selector) : null
  );
  const [, setTick] = useState(0);
  const selector = anchor?.kind === "element" ? anchor.selector : "";

  useEffect(() => {
    if (!selector) return;
    let current = findAnchorElement(selector);
    setPanel(current);
    const redraw = () => flushSync(() => setTick((n) => n + 1));
    current?.addEventListener("scroll", redraw, { passive: true });
    window.addEventListener("resize", redraw);
    // Single page apps render panels late, or replace them; look again now
    // and then, and redraw only when something actually changed
    let last = placementFor(note.position, anchor, current);
    const check = setInterval(() => {
      const found = findAnchorElement(selector);
      if (found !== current) {
        current?.removeEventListener("scroll", redraw);
        current = found;
        current?.addEventListener("scroll", redraw, { passive: true });
        setPanel(current);
      }
      const now = placementFor(note.position, anchor, current);
      if (Math.abs(now.x - last.x) > 0.5 || Math.abs(now.y - last.y) > 0.5 || now.away !== last.away) {
        last = now;
        setTick((n) => n + 1);
      }
    }, 500);
    return () => {
      current?.removeEventListener("scroll", redraw);
      window.removeEventListener("resize", redraw);
      clearInterval(check);
    };
  }, [selector]);

  return placementFor(note.position, anchor, anchor?.kind === "element" ? panel : undefined);
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
  const [dragging, setDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  useDismiss(menuOpen, () => setMenuOpen(false), menuRef, moreRef);

  // Rnd only shows the position/size it is given. The saved position comes
  // back from the background store a moment after a drag ends, so without
  // this the note would snap back to its old spot until then. The dropped
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
  const anchored = usePlacement(note, anchor);
  // Just dropped: where it was dropped, on the page, until the store has it
  const placement = dropped ? { fixed: false, x: dropped.x, y: dropped.y, away: false } : anchored;
  const position = placement;
  const width = resized ? resized.width : note.size.width;

  // Keep notes saved on a wider window from ending up off screen (notes on
  // the page only, as always; anchored ones go where their panel is)
  const isOffScreen = !anchor && !dropped && position.x + width > windowWidth - SCROLLBAR_WIDTH;
  const fixed = Boolean(note.stickify) || placement.fixed;
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

  const color = noteColorProps(resolveNoteColor(note.color));

  return (
    <Rnd
      position={{ x: isOffScreen ? windowWidth - width - SCROLLBAR_WIDTH : position.x, y: position.y }}
      size={{ width, height: "auto" }}
      bounds="window"
      dragHandleClassName="note__drag"
      cancel="input, button, a, [contenteditable], .menu"
      enableResizing={{
        top: false,
        left: false,
        right: true,
        bottom: false,
        topRight: false,
        topLeft: false,
        bottomRight: false,
        bottomLeft: false,
      }}
      resizeHandleClasses={{ right: "note__resize" }}
      minWidth={120}
      disableDragging={Boolean(note.stickify)}
      style={{ position: fixed ? "fixed" : "absolute", zIndex, visibility: away ? "hidden" : undefined }}
      onDragStart={() => {
        onBringToFront();
        setDragging(true);
      }}
      onDragStop={(_event, d) => {
        setDragging(false);
        // A click on the drag handle without moving: nothing to save
        if (d.x === position.x && d.y === position.y) return;
        // Where it is on screen now decides what it moves with from here on
        const screenX = fixed ? d.x : d.x - window.scrollX;
        const screenY = fixed ? d.y : d.y - window.scrollY;
        const pageX = Math.round(screenX + window.scrollX);
        const pageY = Math.round(screenY + window.scrollY);
        setDropped({ x: pageX, y: pageY, at: Date.now() });
        // With the setting off, a moved note is on the page (its anchor, if any, is cleared)
        const found = followPanels ? anchorAt(screenX, screenY, width, layerOf(articleRef.current)) : null;
        actions.move(pageX, pageY, note.stickify ? undefined : found);
      }}
      onResizeStop={(_event, _direction, _ref, delta) => {
        if (delta.width === 0) return;
        const newWidth = width + delta.width;
        setResized({ width: newWidth, at: Date.now() });
        actions.resize(newWidth);
      }}
    >
      <article
        ref={articleRef}
        className={`dm-note note note--page ${color.className} ${dragging ? "is-dragging" : ""} ${menuOpen ? "has-menu" : ""}`}
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
        <div className="dm-note__head note__head note__drag">
          <span className="dm-note__grip" data-testid={TEST_IDS.noteDragHandle} title="Drag to move">
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
    </Rnd>
  );
};
