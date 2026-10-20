// A sticky note on a web page.
//
// Placement is exactly what it has always been: the note's top left corner
// at its saved position (page coordinates, inside a full-page layer at the
// top left of <body>), at its saved width. Only how the note looks changed in
// 5.1, so notes people placed years ago land on the same spot.
import React, { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { PENDING_TIMEOUT_MS } from "../utils/useStoreSyncedText";
import { TEST_IDS } from "../utils/testIds";
import { resolveNoteColor } from "../model/colors";
import type { NoteRecord, Tag } from "../model/types";
import { useNoteActions } from "../ui/useNoteActions";
import { BodyField, NoteMenu, TagEditor, TitleField, noteColorProps, useDismiss } from "../ui/NoteParts";
import { GripIcon, HeartIcon, MoreIcon } from "../ui/icons";

// Room for the page's vertical scrollbar
const SCROLLBAR_WIDTH = 17;

// Websites listen for keys (YouTube's "k", GitHub's "s", ...). Typing in a
// note must not trigger them, so key events stop at the note.
const stop = (event: React.SyntheticEvent) => event.stopPropagation();

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
  const [dragging, setDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
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

  const position = dropped || note.position;
  const width = resized ? resized.width : note.size.width;

  // Keep notes saved on a wider window from ending up off screen
  const isOffScreen = position.x + width > windowWidth - SCROLLBAR_WIDTH;

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
      style={{ position: note.stickify ? "fixed" : "absolute", zIndex }}
      onDragStart={() => {
        onBringToFront();
        setDragging(true);
      }}
      onDragStop={(_event, d) => {
        setDragging(false);
        // A click on the drag handle without moving: nothing to save
        if (d.x === position.x && d.y === position.y) return;
        setDropped({ x: d.x, y: d.y, at: Date.now() });
        actions.move(d.x, d.y);
      }}
      onResizeStop={(_event, _direction, _ref, delta) => {
        if (delta.width === 0) return;
        const newWidth = width + delta.width;
        setResized({ width: newWidth, at: Date.now() });
        actions.resize(newWidth);
      }}
    >
      <article
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
        <TagEditor note={note} tags={tags} actions={actions} />
        <NoteMenu ref={menuRef} open={menuOpen} record={record} actions={actions} onDone={() => setMenuOpen(false)} />
      </article>
    </Rnd>
  );
};
