// The board page (board.html): every note in one place, in two views.
//   Board: a canvas with notes grouped by tag (model/board.ts). Notes can be
//          dragged anywhere; where they were put is remembered in this
//          browser ("board" in storage.local, outside the notes' state).
//          "Arrange by tag" puts them all back in their groups.
//   Tags:  a section per tag with its notes as editable cards, like the
//          popup's. A note with two tags shows in both sections.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allNotes, pageLabel, plainText, tagsOfNote } from "../model/notes";
import { CARD_HEIGHT, CARD_WIDTH, layoutBoard, tagOrder } from "../model/board";
import { resolveNoteColor } from "../model/colors";
import type { NoteRecord, State, Tag } from "../model/types";
import { noteColorProps, TagPill } from "../ui/NoteParts";
import { TargetIcon } from "../ui/icons";
import { UndoProvider } from "../ui/undo";
import { NoteCard } from "../app/NoteCard";
import { findOnPage, useRemembered, useTheme } from "../app/hooks";
import { trackEvent } from "../redux/actions";

type View = "board" | "tags";
type Positions = Record<string, { x: number; y: number }>;

const NO_TAGS: Tag[] = [];
const STORAGE_KEY = "board";
// Movement below this is a click, not a drag
const DRAG_THRESHOLD = 4;

/** Where notes were dragged on the board, kept in storage.local */
const useSavedPositions = (): [Positions, (next: Positions) => void] => {
  const [positions, setPositions] = useState<Positions>({});
  useEffect(() => {
    chrome.storage.local
      .get(STORAGE_KEY)
      .then((stored) => setPositions((stored[STORAGE_KEY] as { positions?: Positions } | undefined)?.positions || {}))
      .catch(() => {});
  }, []);
  const save = (next: Positions) => {
    setPositions(next);
    chrome.storage.local.set({ [STORAGE_KEY]: { positions: next } }).catch(() => {});
  };
  return [positions, save];
};

// --- Board view -------------------------------------------------------------------

const BoardCard = ({
  record,
  tags,
  at,
  onMove,
}: {
  record: NoteRecord;
  tags: Tag[];
  at: { x: number; y: number };
  onMove: (x: number, y: number) => void;
}) => {
  const { note, pageUrl } = record;
  const label = useSelector((state: State) => pageLabel(state, pageUrl));
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const color = noteColorProps(resolveNoteColor(note.color));
  const text = plainText(note.body);

  return (
    <article
      ref={ref}
      className={`dm-note note board-card ${color.className}`}
      style={{ ...color.style, transform: `translate(${at.x}px, ${at.y}px)`, width: CARD_WIDTH, height: CARD_HEIGHT }}
      data-note-id={note.id}
      aria-label={note.title ? `Note: ${note.title}` : "Note"}
      onPointerDown={(event) => {
        if (event.button !== 0 || (event.target as HTMLElement).closest("button, a")) return;
        event.preventDefault();
        event.stopPropagation(); // not a pan of the canvas
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: at.x, y: at.y, moved: false };
      }}
      onPointerMove={(event) => {
        const d = drag.current;
        if (!d || d.id !== event.pointerId) return;
        const dx = event.clientX - d.startX;
        const dy = event.clientY - d.startY;
        if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        d.moved = true;
        // Straight onto the element while dragging; saved once, on drop
        if (ref.current) ref.current.style.transform = `translate(${Math.max(0, d.x + dx)}px, ${Math.max(0, d.y + dy)}px)`;
        ref.current?.classList.add("is-dragging");
      }}
      onPointerUp={(event) => {
        const d = drag.current;
        drag.current = null;
        ref.current?.classList.remove("is-dragging");
        if (!d?.moved) return;
        onMove(Math.max(0, Math.round(d.x + event.clientX - d.startX)), Math.max(0, Math.round(d.y + event.clientY - d.startY)));
      }}
    >
      <div className="dm-note__head">
        <h3 className="dm-note__title board-card__title">{note.title || <span className="board-card__untitled">Untitled</span>}</h3>
        <div className="dm-note__actions">
          <button
            type="button"
            className="dm-note__action"
            aria-label="Find on page"
            title="Find on page"
            onClick={() => findOnPage(record)}
          >
            <TargetIcon />
          </button>
        </div>
      </div>
      {text && <p className="dm-note__body board-card__text">{text}</p>}
      <div className="board-card__foot">
        {tags.length > 0 && (
          <div className="dm-note__tags board-card__tags">
            {tags.map((tag) => (
              <TagPill key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        <span className="board-card__page" title={label}>
          {label}
        </span>
      </div>
    </article>
  );
};

const BoardView = ({ records, tags }: { records: NoteRecord[]; tags: Tag[] }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [saved, save] = useSavedPositions();

  // Groups wrap to the window's width
  useLayoutEffect(() => {
    const measure = () => scroller.current && setWidth(Math.max(CARD_WIDTH * 2, scroller.current.clientWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const layout = useMemo(() => layoutBoard(records, tags, width), [records, tags, width]);
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags]);
  const at = (id: string) => saved[id] || layout.positions[id] || { x: 0, y: 0 };
  // Room for notes dragged past the groups
  const extent = records.reduce(
    (size, { note }) => {
      const p = at(note.id);
      return { w: Math.max(size.w, p.x + CARD_WIDTH + 200), h: Math.max(size.h, p.y + CARD_HEIGHT + 200) };
    },
    { w: layout.width, h: layout.height + 200 }
  );

  // Dragging the empty canvas scrolls it
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  return (
    <>
      <div className="board-toolbar">
        <p className="board-toolbar__hint">Drag notes anywhere. Drag the background to look around.</p>
        <button type="button" className="dm-btn dm-btn--sm" disabled={Object.keys(saved).length === 0} onClick={() => save({})}>
          Arrange by tag
        </button>
      </div>
      <div
        ref={scroller}
        className="board-canvas"
        onPointerDown={(event) => {
          if (event.button !== 0 || !scroller.current) return;
          pan.current = { x: event.clientX, y: event.clientY, left: scroller.current.scrollLeft, top: scroller.current.scrollTop };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!pan.current || !scroller.current) return;
          scroller.current.scrollLeft = pan.current.left - (event.clientX - pan.current.x);
          scroller.current.scrollTop = pan.current.top - (event.clientY - pan.current.y);
        }}
        onPointerUp={() => (pan.current = null)}
        onPointerCancel={() => (pan.current = null)}
      >
        <div className="board-canvas__inner" style={{ width: extent.w, height: extent.h }}>
          {layout.groups.map((group) => (
            <section
              key={group.key}
              className={`board-group ${group.tagIds.length > 1 ? "board-group--shared" : ""}`}
              style={{ transform: `translate(${group.x}px, ${group.y}px)`, width: group.width, height: group.height }}
              aria-label={group.tagIds.length ? group.tagIds.map((id) => tagById.get(id)?.text).join(" and ") : "No tags"}
            >
              <div className="board-group__label">
                {group.tagIds.length ? (
                  group.tagIds.map((id) => {
                    const tag = tagById.get(id);
                    return tag ? <TagPill key={id} tag={tag} /> : null;
                  })
                ) : (
                  <span className="board-group__untagged">No tags</span>
                )}
                <span className="board-group__count">{group.noteIds.length}</span>
              </div>
            </section>
          ))}
          {records.map((record) => (
            <BoardCard
              key={record.note.id}
              record={record}
              tags={tagsOfNote(tags, record.note)}
              at={at(record.note.id)}
              onMove={(x, y) => save({ ...saved, [record.note.id]: { x, y } })}
            />
          ))}
        </div>
      </div>
    </>
  );
};

// --- Tags view --------------------------------------------------------------------

const TagsView = ({ records, tags }: { records: NoteRecord[]; tags: Tag[] }) => {
  const sections = useMemo(() => {
    const withTag = (tagId: string) => records.filter(({ note }) => (note.tags || []).some(({ id }) => id === tagId));
    const known = new Set(tags.map((tag) => tag.id));
    const untagged = records.filter(({ note }) => !(note.tags || []).some(({ id }) => known.has(id)));
    return [
      ...tagOrder(records, tags).map((tag) => ({ key: tag.id, tag, records: withTag(tag.id) })),
      ...(untagged.length ? [{ key: "untagged", tag: null, records: untagged }] : []),
    ];
  }, [records, tags]);

  return (
    <div className="tag-sections">
      {sections.map((section) => (
        <section key={section.key} className="tag-section" aria-label={section.tag ? `Tag ${section.tag.text}` : "No tags"}>
          <h2 className="tag-section__title">
            {section.tag ? <TagPill tag={section.tag} /> : <span className="board-group__untagged">No tags</span>}
            <span className="board-group__count">{section.records.length}</span>
          </h2>
          <div className="tag-section__grid">
            {section.records.map((record) => (
              <NoteCard key={record.note.id} record={record} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

// --- Page -------------------------------------------------------------------------

export const Board = () => {
  useTheme();
  const dispatch = useDispatch();
  const pages = useSelector((state: State) => state.pages);
  const tags = useSelector((state: State) => state.tags) || NO_TAGS;
  const records = useMemo(() => allNotes({ pages }), [pages]);
  const [view, setView] = useRemembered<View>("board:view", "board");

  useEffect(() => {
    dispatch(trackEvent("board_opened", { view, note_count: records.length, tag_count: tags.length }));
  }, []);

  return (
    <UndoProvider>
      <div className="board-page">
        <header className="bar board-bar">
          <span className="wordmark">Docamatic</span>
          <span className="dm-tag dm-tag--blue preview-tag">Preview</span>
          <div className="dm-tabs board-tabs" role="tablist" aria-label="View">
            {(["board", "tags"] as View[]).map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={view === name}
                className="dm-tab"
                onClick={() => {
                  setView(name);
                  dispatch(trackEvent("board_view_changed", { view: name }));
                }}
              >
                {name === "board" ? "Board" : "By tag"}
              </button>
            ))}
          </div>
          <span className="bar__spacer" />
          <span className="board-bar__count">
            {records.length} {records.length === 1 ? "note" : "notes"}
          </span>
        </header>
        {records.length === 0 ? (
          <div className="board-empty">
            <h1 className="view-title">No notes yet</h1>
            <p>Notes you add on any website show up here, grouped by their tags.</p>
          </div>
        ) : view === "board" ? (
          <BoardView records={records} tags={tags} />
        ) : (
          <TagsView records={records} tags={tags} />
        )}
      </div>
    </UndoProvider>
  );
};
