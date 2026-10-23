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
import { useDispatch, useSelector } from "react-redux";
import { PENDING_TIMEOUT_MS } from "../utils/useStoreSyncedText";
import { TEST_IDS } from "../utils/testIds";
import { resolveNoteColor } from "../model/colors";
import type { Note, NoteAnchor, NoteRecord, State, Tag } from "../model/types";
import { anchorAt, findAnchorElement, panelMode, placementFor } from "./anchor";
import { registerNote } from "./noteRegistry";
import { transformFor, useDragResize } from "./useDragResize";
import { useNoteActions } from "../ui/useNoteActions";
import { BodyField, NoteMenu, TagEditor, TitleField, noteColorProps, useDismiss } from "../ui/NoteParts";
import { ChevronIcon, GripIcon, HeartIcon, MoreIcon, PinIcon } from "../ui/icons";
import { dismissHint } from "../redux/actions";

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
 * The tip in a new note, until someone says "Got it" (model/hints.ts): how to
 * move it, fold it, and find the rest. Notes are made from the popup, the
 * right-click menu or the shortcut, and none of those show how a note works.
 */
const FirstNoteHint = () => {
  const dispatch = useDispatch();
  return (
    <div className="note__hint" role="note" data-testid={TEST_IDS.noteHint}>
      <p>
        Drag the top bar to move this note.{" "}
        <span role="img" aria-label="Collapse">
          <ChevronIcon up size={13} />
        </span>{" "}
        folds it up, and{" "}
        <span role="img" aria-label="More options">
          <MoreIcon size={13} />
        </span>{" "}
        has colors, tags and more.
      </p>
      <button
        type="button"
        className="dm-btn dm-btn--sm"
        data-testid={TEST_IDS.noteHintDismiss}
        onClick={() => dispatch(dismissHint("first_note"))}
      >
        Got it
      </button>
    </div>
  );
};

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
  // Only in a note that was just made, until it's put away. autoFocus is
  // only true on the note's first render, so it's kept from then.
  const [isNew] = useState(autoFocus);
  const showHint = useSelector((state: State) => isNew && !state.metadata?.hints?.first_note);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const pressedGrip = useRef(false);
  const lastGripTap = useRef(0);
  useDismiss(menuOpen, () => setMenuOpen(false), menuRef, moreRef);

  // The saved position comes back from the background store a moment after
  // a drag ends, so without this the note would snap back to its old spot
  // until then. The dropped position is used until the store has caught up
  // with it (or it's been a while, so a move made in another tab still comes
  // through). Same idea as useStoreSyncedText for typing.
  const [dropped, setDropped] = useState<{ x: number; y: number; fixed: boolean; at: number } | null>(null);
  const [resized, setResized] = useState<{ width: number; at: number } | null>(null);

  useEffect(() => {
    if (!dropped) return;
    const caughtUp = note.position.x === dropped.x && note.position.y === dropped.y;
    if (caughtUp || Date.now() - dropped.at > PENDING_TIMEOUT_MS) setDropped(null);
  }, [note.position.x, note.position.y]);

  // A note dropped where it already was never sees its position change, so
  // the effect above wouldn't run; without this it would keep its dropped
  // spot for good (not following its panel, ignoring moves from other tabs)
  useEffect(() => {
    if (!dropped) return;
    const timer = setTimeout(() => setDropped(null), PENDING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [dropped]);

  useEffect(() => {
    if (!resized) return;
    if (note.size.width === resized.width || Date.now() - resized.at > PENDING_TIMEOUT_MS) setResized(null);
  }, [note.size.width]);

  const pinned = Boolean(note.stickify);
  const followPanels = useFollowPanels();
  // A note kept on screen doesn't follow anything else
  const anchor = followPanels && !pinned ? note.anchor : undefined;
  const { placement: anchored, panel } = usePlacement(note, anchor);
  // Just dropped: where it was dropped, until the store has it
  const placement = dropped ? { fixed: dropped.fixed, x: dropped.x, y: dropped.y, away: false } : anchored;
  const width = resized ? resized.width : note.size.width;
  const collapsed = Boolean(note.collapsed);

  // Keep notes saved on a wider window from ending up off screen (notes on
  // the page only, as always; anchored ones go where their panel is)
  const isOffScreen = !anchor && !dropped && placement.x + width > windowWidth - SCROLLBAR_WIDTH;
  const fixed = pinned || placement.fixed;
  // Never past the left or top edge either, where it couldn't be scrolled to
  // (saved on a narrower window, or by an older version that let notes be
  // dragged above the page). Only where it's drawn; the saved position stays.
  const edge = (value: number) => (anchor ? value : Math.max(0, value));
  const shownAt = { x: edge(isOffScreen ? windowWidth - width - SCROLLBAR_WIDTH : placement.x), y: edge(placement.y) };

  // Moves the note to a spot on screen. Kept on screen: all of it if it
  // fits, otherwise its top. What's under it there decides what it moves
  // with from then on (with the setting on).
  const moveTo = (screenX: number, screenY: number) => {
    const onScreen = (value: number, size: number, room: number) => Math.min(Math.max(0, value), Math.max(0, room - size));
    const height = articleRef.current?.offsetHeight || 40;
    const x = Math.round(onScreen(screenX, width, window.innerWidth - SCROLLBAR_WIDTH));
    const y = Math.round(onScreen(screenY, Math.min(height, window.innerHeight), window.innerHeight));
    if (pinned) {
      // Kept on screen: its position is on screen
      setDropped({ x, y, fixed: true, at: Date.now() });
      actions.move(x, y);
      return;
    }
    const pageX = Math.round(x + window.scrollX);
    const pageY = Math.round(y + window.scrollY);
    setDropped({ x: pageX, y: pageY, fixed: false, at: Date.now() });
    // With the setting off, a moved note is on the page (its anchor, if any, is cleared)
    actions.move(pageX, pageY, followPanels ? anchorAt(x, y, width, layerOf(articleRef.current)) : null);
  };

  const { dragging, handle, resizeHandle, cornerHandle, onGripKeyDown, drawnAt, drawnWidth, drawnHeight } = useDragResize({
    boxRef,
    position: shownAt,
    width,
    height: collapsed ? undefined : note.size.height,
    fixed,
    disabled: false,
    onStart: onBringToFront,
    // Two quick taps on the grip collapse or expand the note. Counted here
    // rather than with dblclick: presses are captured for dragging, which
    // sends the browser's click events elsewhere.
    onTap: () => {
      if (!pressedGrip.current) return;
      const now = Date.now();
      if (now - lastGripTap.current < 400) {
        lastGripTap.current = 0;
        actions.setCollapsed(!collapsed);
      } else {
        lastGripTap.current = now;
      }
    },
    onDrop: (x, y) => moveTo(fixed ? x : x - window.scrollX, fixed ? y : y - window.scrollY),
    onResize: (newWidth, newHeight) => {
      if (newWidth !== width) {
        setResized({ width: newWidth, at: Date.now() });
        actions.resize(newWidth);
      }
      if (newHeight !== undefined) actions.setHeight(newHeight);
    },
    onAutoHeight: () => actions.setHeight(null),
  });

  // A note in a panel whose corner has scrolled out of the panel goes away
  // whole, rather than showing half of it over whatever is next to the panel
  const away = Boolean(placement.away) && !menuOpen && !dragging;

  // A note just added over a scrolling panel or a fixed part of the page
  // moves with it from the start
  useEffect(() => {
    if (!autoFocus || note.anchor || !followPanels || pinned) return;
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

  const [found, setFound] = useState(false);
  const pointOut = () => {
    setFound(true);
    setTimeout(() => setFound(false), 2400);
  };

  // What the popup and side panel can ask of this note (page/noteRegistry.ts)
  useEffect(
    () =>
      registerNote(note.id, {
        // "Find on page": scroll to it and point it out
        reveal: () => {
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
          } else if (fixed) {
            // Always on screen, unless the window got smaller since: bring it back in
            const box = boxRef.current?.getBoundingClientRect();
            if (box && (box.right < 40 || box.left > window.innerWidth - 40 || box.top > window.innerHeight - 40 || box.bottom < 40)) {
              moveTo(box.left, box.top);
            }
          } else {
            window.scrollTo({ top: Math.max(0, placement.y - 120), left: Math.max(0, placement.x - 40), behavior });
          }
          pointOut();
        },
        // "Bring here": to the top right of what's on screen, like a new note
        bringHere: () => {
          onBringToFront();
          moveTo(window.innerWidth - SCROLLBAR_WIDTH - width - 24, 96);
          pointOut();
        },
        place: () => {
          if (placement.away) return "away";
          const box = boxRef.current?.getBoundingClientRect();
          if (!box) return "visible";
          if (box.bottom < 24) return "above";
          if (box.top > window.innerHeight - 24) return "below";
          if (box.right < 24 || box.left > window.innerWidth - 24) return "aside";
          return "visible";
        },
      }),
    [note.id, anchor, panel, placement.x, placement.y, placement.away, width, fixed, pinned, followPanels]
  );

  const color = noteColorProps(resolveNoteColor(note.color));
  const height = collapsed ? undefined : drawnHeight;

  return (
    <div
      ref={boxRef}
      className="note-box"
      style={
        {
          // Same positioning react-rnd used before 5.1 (top left of the notes'
          // layer, then translated), so notes land exactly where they always have
          position: fixed ? "fixed" : "absolute",
          top: 0,
          left: 0,
          transform: transformFor(drawnAt.x, drawnAt.y),
          width: drawnWidth,
          zIndex,
          visibility: away ? "hidden" : undefined,
          "--note-height": height ? `${height}px` : undefined,
        } as React.CSSProperties
      }
    >
      <article
        ref={articleRef}
        className={[
          "dm-note note note--page",
          color.className,
          dragging && "is-dragging",
          menuOpen && "has-menu",
          found && "is-found",
          collapsed && "note--collapsed",
          height && "note--sized",
          pinned && "note--pinned",
        ]
          .filter(Boolean)
          .join(" ")}
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
        <div
          className="dm-note__head note__head note__drag"
          {...handle}
          onPointerDown={(event) => {
            pressedGrip.current = Boolean((event.target as HTMLElement).closest(".dm-note__grip"));
            handle.onPointerDown(event);
          }}
        >
          <span
            className="dm-note__grip"
            data-testid={TEST_IDS.noteDragHandle}
            title="Drag to move (or use the arrow keys)"
            role="button"
            tabIndex={0}
            aria-label="Move note (arrow keys)"
            onKeyDown={onGripKeyDown}
          >
            <GripIcon />
          </span>
          <TitleField note={note} actions={actions} className="dm-note__title" />
          <div className="dm-note__actions">
            {pinned && (
              <span className="note__pin" title="Kept on screen while the page scrolls">
                <PinIcon size={13} />
              </span>
            )}
            {/* One click to fold the note down to this bar and back. Shown
                when the pointer is over the note, so notes stay plain, and
                always on a collapsed note so it's clear how to open it */}
            <button
              type="button"
              className="dm-note__action note__collapse"
              aria-label={collapsed ? "Expand note" : "Collapse note"}
              aria-expanded={!collapsed}
              title={collapsed ? "Expand" : "Collapse"}
              data-testid={TEST_IDS.noteCollapse}
              onClick={() => actions.setCollapsed(!collapsed)}
            >
              <ChevronIcon up={!collapsed} />
            </button>
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
        {!collapsed && (
          <>
            <BodyField note={note} actions={actions} className="dm-note__body" autoFocus={autoFocus} />
            <TagEditor tags={tags} actions={actions} adding={addingTag} onDoneAdding={() => setAddingTag(false)} />
            {showHint && <FirstNoteHint />}
          </>
        )}
        <NoteMenu
          ref={menuRef}
          open={menuOpen}
          record={record}
          actions={actions}
          onDone={() => setMenuOpen(false)}
          onAddTag={() => {
            if (collapsed) actions.setCollapsed(false);
            setAddingTag(true);
          }}
          page={{
            pinned,
            collapsed,
            onTogglePin: () => {
              const box = boxRef.current?.getBoundingClientRect();
              if (!box) return;
              // Pinned notes keep their spot on screen; unpinned, on the page
              actions.setPinned(
                !pinned,
                pinned
                  ? { x: Math.round(box.left + window.scrollX), y: Math.round(box.top + window.scrollY) }
                  : { x: Math.round(box.left), y: Math.round(box.top) }
              );
            },
            onToggleCollapsed: () => actions.setCollapsed(!collapsed),
          }}
        />
      </article>
      {!collapsed && <div className="note__resize" aria-hidden="true" {...resizeHandle} />}
      {!collapsed && (
        <div
          className="note__corner"
          aria-hidden="true"
          title="Drag to resize. Double-click to fit the text again."
          {...cornerHandle}
        />
      )}
    </div>
  );
};
