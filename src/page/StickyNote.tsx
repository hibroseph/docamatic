// A sticky note on a web page.
//
// Placement is exactly what it has always been: the note's top left corner
// at its saved position (page coordinates, inside a full-page layer at the
// top left of <body>), at its saved width. Only how the note looks changed in
// 5.1, so notes people placed years ago land on the same spot.
//
// Since 5.1 a note dropped over a scrolling panel or a fixed part of the page
// moves with it instead (page/anchor.ts). Notes that were never moved since
// keep the old behavior.
import React, { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { PENDING_TIMEOUT_MS } from "../utils/useStoreSyncedText";
import { TEST_IDS } from "../utils/testIds";
import { resolveNoteColor } from "../model/colors";
import type { Note, NoteRecord, Tag } from "../model/types";
import { anchorAt, clipPathFor, placementFor } from "./anchor";
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

/**
 * Where a note is drawn, kept up to date while panels scroll. Notes without
 * an anchor never change here, so they cost nothing.
 */
const usePlacement = (note: Note) => {
  const [, setTick] = useState(0);
  const anchor = note.anchor;
  useEffect(() => {
    if (!anchor) return;
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setTick((n) => n + 1);
      });
    };
    // Scroll events don't bubble, but they can be caught on the way down
    document.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);
    // A panel that isn't there yet (single page apps render late) is looked for again
    const retry = setInterval(update, 1000);
    return () => {
      document.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
      clearInterval(retry);
      cancelAnimationFrame(frame);
    };
  }, [anchor?.kind, anchor && "selector" in anchor ? anchor.selector : ""]);
  return placementFor(note.position, anchor);
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

  const anchored = usePlacement(note);
  // Just dropped: where it was dropped, on the page, until the store has it
  const placement = dropped ? { fixed: false, x: dropped.x, y: dropped.y } : anchored;
  const position = placement;
  const width = resized ? resized.width : note.size.width;

  // Keep notes saved on a wider window from ending up off screen (notes on
  // the page only, as always; anchored ones go where their panel is)
  const isOffScreen = !note.anchor && !dropped && position.x + width > windowWidth - SCROLLBAR_WIDTH;
  const fixed = Boolean(note.stickify) || placement.fixed;
  const clipPath = menuOpen || dragging ? undefined : clipPathFor(placement, width, articleRef.current?.offsetHeight || 0);

  // A note just added over a scrolling panel or a fixed part of the page
  // moves with it from the start
  useEffect(() => {
    if (!autoFocus || note.anchor) return;
    const frame = requestAnimationFrame(() => {
      const anchor = anchorAt(note.position.x - window.scrollX, note.position.y - window.scrollY, layerOf(articleRef.current));
      if (anchor) actions.move(note.position.x, note.position.y, anchor);
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
      style={{ position: fixed ? "fixed" : "absolute", zIndex, clipPath }}
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
        actions.move(pageX, pageY, note.stickify ? undefined : anchorAt(screenX, screenY, layerOf(articleRef.current)));
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
