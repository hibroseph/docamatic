// The board page (board.html): every note in one place, in two views.
//   Board: a canvas with notes grouped by tag (model/board.ts). Notes can be
//          dragged anywhere; where they were put is remembered in this
//          browser ("board" in storage.local, outside the notes' state).
//          "Arrange by tag" puts them all back in their groups.
//   Tags:  a section per tag with its notes in a grid. A note with two tags
//          shows in both sections.
//   Sites: a section per website, and in it each page with its notes.
// The canvas can group by tag or by website; each keeps its own arrangement.
// Search works in both: on the canvas notes that don't match fade (so the
// arrangement stays put), in the grid they're left out. The "Edit notes"
// switch turns the cards into editable ones; off, the page is for looking
// and arranging, and a stray click or drag can't change a note.
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useDispatch, useSelector } from "react-redux";
import { allNotes, pageLabel, plainText, tagsOfNote } from "../model/notes";
import { CARD_HEIGHT, CARD_WIDTH, groupBySite, layoutBoard, tagOrder, type Grouping } from "../model/board";
import { searchNotes } from "../model/search";
import { resolveNoteColor } from "../model/colors";
import type { NoteRecord, State, Tag } from "../model/types";
import { BodyField, noteColorProps, TagPill, TitleField } from "../ui/NoteParts";
import { useNoteActions } from "../ui/useNoteActions";
import { CloseIcon, OpenIcon, SearchIcon, TargetIcon } from "../ui/icons";
import { UndoProvider } from "../ui/undo";
import { NoteCard } from "../app/NoteCard";
import { SurveyPrompt } from "../app/Survey";
import { findOnPage, useRemembered, useTheme } from "../app/hooks";
import { dismissHint, trackEvent } from "../redux/actions";
import { TEST_IDS } from "../utils/testIds";
import { EXTERNAL_LINK_PROPS, safeHref } from "../utils/SafeLink";

type View = "board" | "tags" | "sites";
type Positions = Record<string, { x: number; y: number }>;
type Track = (event: string, properties?: Record<string, unknown>) => void;

const NO_TAGS: Tag[] = [];
const STORAGE_KEY = "board";
// Movement below this is a click, not a drag
const DRAG_THRESHOLD = 4;
// A search is counted once typing has stopped for this long
const SEARCH_SETTLE_MS = 1200;
// Pressing on these inside a card edits or clicks; it doesn't drag the card
const NOT_A_DRAG = "button, a, input, textarea, [contenteditable], .note-body-field";

/** Where notes were dragged on the board, kept in storage.local */
// Each grouping has its own arrangement: { positions } (by tag, the first
// one) and { sitePositions } (by website)
type SavedBoard = { positions?: Positions; sitePositions?: Positions };
const SAVED_KEY: Record<Grouping, keyof SavedBoard> = { tag: "positions", site: "sitePositions" };

const useSavedPositions = (grouping: Grouping): [Positions, (next: Positions) => void] => {
  const [stored, setStored] = useState<SavedBoard>({});
  useEffect(() => {
    chrome.storage.local
      .get(STORAGE_KEY)
      .then((data) => setStored((data[STORAGE_KEY] as SavedBoard | undefined) || {}))
      .catch(() => {});
  }, []);
  const save = (next: Positions) => {
    const all = { ...stored, [SAVED_KEY[grouping]]: next };
    setStored(all);
    chrome.storage.local.set({ [STORAGE_KEY]: all }).catch(() => {});
  };
  return [stored[SAVED_KEY[grouping]] || {}, save];
};

// --- A note's card ----------------------------------------------------------------

// Opens a note in full (cards on the board are small and cut the text off)
const OpenNote = createContext<(noteId: string) => void>(() => {});

/** What's inside a card on this page: read only, or editable title and text */
const CardContent = ({ record, tags, editing, onFind }: { record: NoteRecord; tags: Tag[]; editing: boolean; onFind: () => void }) => {
  const { note, pageUrl } = record;
  const label = useSelector((state: State) => pageLabel(state, pageUrl));
  const actions = useNoteActions(record);
  const openNote = useContext(OpenNote);
  const text = plainText(note.body);
  return (
    <>
      <div className="dm-note__head">
        {editing ? (
          <TitleField note={note} actions={actions} className="dm-note__title board-card__title" />
        ) : (
          <h3 className="dm-note__title board-card__title">{note.title || <span className="board-card__untitled">Untitled</span>}</h3>
        )}
        <div className="dm-note__actions">
          <button
            type="button"
            className="dm-note__action"
            aria-label="Open note"
            title="Open (or double-click the note)"
            data-testid={TEST_IDS.boardNoteOpen}
            onClick={() => openNote(note.id)}
          >
            <OpenIcon />
          </button>
          <button type="button" className="dm-note__action" aria-label="Find on page" title="Find on page" onClick={onFind}>
            <TargetIcon />
          </button>
        </div>
      </div>
      {editing ? (
        <div className="board-card__edit">
          <BodyField note={note} actions={actions} className="dm-note__body" />
        </div>
      ) : (
        text && <p className="dm-note__body board-card__text">{text}</p>
      )}
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
    </>
  );
};

const BoardCard = ({
  record,
  tags,
  at,
  editing,
  dimmed,
  onMove,
  onFind,
}: {
  record: NoteRecord;
  tags: Tag[];
  at: { x: number; y: number };
  editing: boolean;
  dimmed: boolean;
  onMove: (x: number, y: number) => void;
  onFind: () => void;
}) => {
  const { note } = record;
  const openNote = useContext(OpenNote);
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const color = noteColorProps(resolveNoteColor(note.color));

  return (
    <article
      ref={ref}
      className={`dm-note note board-card ${color.className} ${dimmed ? "is-dimmed" : ""}`}
      style={{ ...color.style, transform: `translate(${at.x}px, ${at.y}px)`, width: CARD_WIDTH, height: CARD_HEIGHT }}
      data-note-id={note.id}
      aria-label={note.title ? `Note: ${note.title}` : "Note"}
      onDoubleClick={(event) => {
        if (!(event.target as HTMLElement).closest(NOT_A_DRAG)) openNote(note.id);
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || (event.target as HTMLElement).closest(NOT_A_DRAG)) return;
        event.preventDefault();
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
      <CardContent record={record} tags={tags} editing={editing} onFind={onFind} />
    </article>
  );
};

/** A read-only card in the By tag grid (with editing on, the popup's card is used) */
const GridCard = ({ record, tags, onFind }: { record: NoteRecord; tags: Tag[]; onFind: () => void }) => {
  const color = noteColorProps(resolveNoteColor(record.note.color));
  const openNote = useContext(OpenNote);
  return (
    <article
      className={`dm-note note board-card board-card--grid ${color.className}`}
      style={color.style}
      data-note-id={record.note.id}
      aria-label={record.note.title ? `Note: ${record.note.title}` : "Note"}
      onDoubleClick={(event) => {
        if (!(event.target as HTMLElement).closest(NOT_A_DRAG)) openNote(record.note.id);
      }}
    >
      <CardContent record={record} tags={tags} editing={false} onFind={onFind} />
    </article>
  );
};

// --- A note opened in full ----------------------------------------------------------

/**
 * The whole note, over the page. With "Edit notes" on it's the popup's full
 * card (title, text, tags, color, ...); off, it's read only, like the cards.
 * Closes with Escape, the Close button, or a click beside it.
 */
const NoteDialog = ({ record, tags, editing, onClose, onFind }: { record: NoteRecord; tags: Tag[]; editing: boolean; onClose: () => void; onFind: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const { note, pageUrl } = record;
  const label = useSelector((state: State) => pageLabel(state, pageUrl));
  const color = noteColorProps(resolveNoteColor(note.color));
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="note-dialog"
      aria-label={note.title ? `Note: ${note.title}` : "Note"}
      data-testid={TEST_IDS.boardNoteDialog}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
    >
      {editing ? (
        <NoteCard record={record} autoFocus={false} />
      ) : (
        <article className={`dm-note note note-dialog__note ${color.className}`} style={color.style}>
          <div className="dm-note__head">
            <h2 className="dm-note__title">{note.title || <span className="board-card__untitled">Untitled</span>}</h2>
          </div>
          {/* Sanitized: notes can hold markup pasted in from web pages */}
          <div className="dm-note__body note-dialog__body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.body || "") }} />
          {tags.length > 0 && (
            <div className="dm-note__tags">
              {tags.map((tag) => (
                <TagPill key={tag.id} tag={tag} />
              ))}
            </div>
          )}
          <span className="board-card__page">{label}</span>
        </article>
      )}
      <div className="note-dialog__actions">
        <button type="button" className="dm-btn dm-btn--sm" onClick={onFind}>
          <TargetIcon /> Find on page
        </button>
        <button type="button" className="dm-btn dm-btn--sm" onClick={() => dialog.current?.close()}>
          Close
        </button>
      </div>
    </dialog>
  );
};

// --- Board view -------------------------------------------------------------------

const BoardView = ({
  records,
  tags,
  editing,
  matches,
  track,
}: {
  records: NoteRecord[];
  tags: Tag[];
  editing: boolean;
  matches: Set<string> | null;
  track: Track;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [grouping, setGrouping] = useRemembered<Grouping>("board:grouping", "tag");
  const [saved, save] = useSavedPositions(grouping);

  // Groups wrap to the window's width
  useLayoutEffect(() => {
    const measure = () => scroller.current && setWidth(Math.max(CARD_WIDTH * 2, scroller.current.clientWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const layout = useMemo(() => layoutBoard(records, tags, width, grouping), [records, tags, width, grouping]);
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

  // A new search brings the first match (top left) into view if it's off screen
  const matchKey = matches ? [...matches].join() : "";
  useEffect(() => {
    const el = scroller.current;
    if (!matches?.size || !el) return;
    const first = [...matches]
      .map((id) => ({ id, ...at(id) }))
      .sort((a, b) => a.y - b.y || a.x - b.x)[0]!;
    const inView =
      first.x >= el.scrollLeft && first.y >= el.scrollTop && first.x + CARD_WIDTH <= el.scrollLeft + el.clientWidth && first.y + CARD_HEIGHT <= el.scrollTop + el.clientHeight;
    if (!inView) el.scrollTo({ left: Math.max(0, first.x - 40), top: Math.max(0, first.y - 40), behavior: "smooth" });
  }, [matchKey]);

  // Dragging the empty canvas scrolls it
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  return (
    <>
      <div className="board-toolbar">
        <p className="board-toolbar__hint">
          {editing
            ? "Click a note's title or text to edit it. Drag it by its edges to move it."
            : "Drag notes anywhere. Drag the background to look around."}
        </p>
        <span className="board-toolbar__label" id="group-by">Group by</span>
        <div className="dm-tabs board-grouping" role="radiogroup" aria-labelledby="group-by">
          {(["tag", "site"] as Grouping[]).map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={grouping === name}
              className="dm-tab"
              data-testid={TEST_IDS.boardGroupBy(name)}
              onClick={() => {
                setGrouping(name);
                track("board_grouping_changed", { grouping: name });
              }}
            >
              {name === "tag" ? "Tag" : "Website"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="dm-btn dm-btn--sm"
          disabled={Object.keys(saved).length === 0}
          onClick={() => {
            track("board_arranged", { moved_count: Object.keys(saved).length, grouping });
            save({});
          }}
        >
          {grouping === "site" ? "Arrange by website" : "Arrange by tag"}
        </button>
      </div>
      <div
        ref={scroller}
        className="board-canvas"
        onPointerDown={(event) => {
          // Only the empty canvas: a press on a card is the card's
          if (event.button !== 0 || !scroller.current || (event.target as HTMLElement).closest(".board-card")) return;
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
              className={`board-group ${group.tagIds.length > 1 ? "board-group--shared" : ""} ${
                matches && !group.noteIds.some((id) => matches.has(id)) ? "is-dimmed" : ""
              }`}
              style={{ transform: `translate(${group.x}px, ${group.y}px)`, width: group.width, height: group.height }}
              aria-label={group.site || (group.tagIds.length ? group.tagIds.map((id) => tagById.get(id)?.text).join(" and ") : "No tags")}
            >
              <div className="board-group__label">
                {group.site ? (
                  <span className="board-group__site">{group.site}</span>
                ) : group.tagIds.length ? (
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
              editing={editing}
              dimmed={Boolean(matches && !matches.has(record.note.id))}
              onMove={(x, y) => {
                track("board_note_moved", { searching: Boolean(matches) });
                save({ ...saved, [record.note.id]: { x, y } });
              }}
              onFind={() => {
                track("board_find_on_page", { view: "board" });
                findOnPage(record);
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

// --- Tags view --------------------------------------------------------------------

const TagsView = ({
  records,
  tags,
  editing,
  matches,
  track,
}: {
  records: NoteRecord[];
  tags: Tag[];
  editing: boolean;
  matches: Set<string> | null;
  track: Track;
}) => {
  const sections = useMemo(() => {
    const shown = matches ? records.filter(({ note }) => matches.has(note.id)) : records;
    const withTag = (tagId: string) => shown.filter(({ note }) => (note.tags || []).some(({ id }) => id === tagId));
    const known = new Set(tags.map((tag) => tag.id));
    const untagged = shown.filter(({ note }) => !(note.tags || []).some(({ id }) => known.has(id)));
    return [
      ...tagOrder(shown, tags).map((tag) => ({ key: tag.id, tag, records: withTag(tag.id) })),
      ...(untagged.length ? [{ key: "untagged", tag: null, records: untagged }] : []),
    ];
  }, [records, tags, matches]);

  if (sections.length === 0) {
    return (
      <div className="board-empty">
        <p>No notes match your search.</p>
      </div>
    );
  }

  return (
    <div className="tag-sections">
      {sections.map((section) => (
        <section key={section.key} className="tag-section" aria-label={section.tag ? `Tag ${section.tag.text}` : "No tags"}>
          <h2 className="tag-section__title">
            {section.tag ? <TagPill tag={section.tag} /> : <span className="board-group__untagged">No tags</span>}
            <span className="board-group__count">{section.records.length}</span>
          </h2>
          <div className="tag-section__grid">
            {section.records.map((record) =>
              editing ? (
                <NoteCard key={record.note.id} record={record} />
              ) : (
                <GridCard
                  key={record.note.id}
                  record={record}
                  tags={tagsOfNote(tags, record.note)}
                  onFind={() => {
                    track("board_find_on_page", { view: "tags" });
                    findOnPage(record);
                  }}
                />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
};

// --- Sites view -------------------------------------------------------------------

/** A section per website (most notes first), and in it each page with its notes */
const SitesView = ({
  records,
  tags,
  editing,
  matches,
  track,
}: {
  records: NoteRecord[];
  tags: Tag[];
  editing: boolean;
  matches: Set<string> | null;
  track: Track;
}) => {
  const pages = useSelector((state: State) => state.pages);
  const sites = useMemo(() => {
    const shown = matches ? records.filter(({ note }) => matches.has(note.id)) : records;
    const byId = new Map(shown.map((record) => [record.note.id, record]));
    return groupBySite(shown).map((group) => {
      const groupRecords = group.noteIds.map((id) => byId.get(id)!);
      // Pages in the order groupBySite put their notes (newest page first)
      const pageUrls = [...new Set(groupRecords.map(({ pageUrl }) => pageUrl))];
      return { site: group.site!, count: groupRecords.length, pages: pageUrls.map((url) => ({ url, records: groupRecords.filter(({ pageUrl }) => pageUrl === url) })) };
    });
  }, [records, matches]);

  if (sites.length === 0) {
    return (
      <div className="board-empty">
        <p>No notes match your search.</p>
      </div>
    );
  }

  return (
    <div className="tag-sections">
      {sites.map((site) => (
        <section key={site.site} className="tag-section site-section" aria-label={`Website ${site.site}`}>
          <h2 className="tag-section__title">
            <span className="site-section__name">{site.site}</span>
            <span className="board-group__count">{site.count}</span>
          </h2>
          {site.pages.map((page) => {
            const href = safeHref(page.url);
            const label = pageLabel({ pages }, page.url);
            return (
              <div key={page.url} className="site-page">
                <h3 className="site-page__title">
                  {href ? (
                    <a href={href} {...EXTERNAL_LINK_PROPS} onClick={() => track("board_page_opened", { view: "sites" })}>
                      {label}
                    </a>
                  ) : (
                    label
                  )}
                </h3>
                <div className="tag-section__grid">
                  {page.records.map((record) =>
                    editing ? (
                      <NoteCard key={record.note.id} record={record} showPage={false} />
                    ) : (
                      <GridCard
                        key={record.note.id}
                        record={record}
                        tags={tagsOfNote(tags, record.note)}
                        onFind={() => {
                          track("board_find_on_page", { view: "sites" });
                          findOnPage(record);
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
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
  const [editMode, setEditMode] = useRemembered<"on" | "off">("board:editing", "off");
  const editing = editMode === "on";
  const [query, setQuery] = useState("");
  // The note opened in full, if any; looked up live so edits show
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = openId ? records.find(({ note }) => note.id === openId) : undefined;
  const openNote = (noteId: string) => {
    setOpenId(noteId);
    track("board_note_opened", { editing });
  };
  const searchInput = useRef<HTMLInputElement>(null);
  const editedOnce = useRef(false);

  // Usage only: counts and on/off, never what was searched or written
  const track: Track = (event, properties = {}) => dispatch(trackEvent(event, { view, ...properties }));

  const matches = useMemo(
    () => (query.trim() ? new Set(searchNotes({ pages, tags }, { text: query, tagIds: [] }).map(({ note }) => note.id)) : null),
    [pages, tags, query]
  );

  const boardHintDone = useSelector((state: State) => state.metadata?.hints?.board === true);
  useEffect(() => {
    // Where it was opened from (popup header, All notes, ...): which way people find it
    const from = new URLSearchParams(location.search).get("from") || "direct";
    track("board_opened", { note_count: records.length, tag_count: tags.length, editing, from: from.slice(0, 30) });
    // They've found the board: the popup stops pointing at it (app/BoardHint.tsx)
    if (!boardHintDone) dispatch(dismissHint("board", "used"));
  }, []);

  useEffect(() => {
    if (!matches) return;
    const timer = setTimeout(
      () => track("board_searched", { result_count: matches.size, note_count: records.length, word_count: query.trim().split(/\s+/).length }),
      SEARCH_SETTLE_MS
    );
    return () => clearTimeout(timer);
  }, [query]);

  // "/" searches (unless typing somewhere), like the popup
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || target.closest("input, textarea, [contenteditable]")) return;
      event.preventDefault();
      searchInput.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <UndoProvider>
     <OpenNote.Provider value={openNote}>
      <div
        className={`board-page ${editing ? "is-editing" : ""}`}
        // The first edit made on this page, so it's known that people edit here
        onInputCapture={(event) => {
          if (editedOnce.current || (event.target as HTMLElement).closest(".board-search")) return;
          editedOnce.current = true;
          track("board_note_edited");
        }}
      >
        <header className="bar board-bar">
          <span className="wordmark">Docamatic</span>
          <span className="dm-tag dm-tag--blue preview-tag">Preview</span>
          <div className="dm-tabs board-tabs" role="tablist" aria-label="View">
            {(["board", "tags", "sites"] as View[]).map((name) => (
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
                {name === "board" ? "Board" : name === "tags" ? "By tag" : "By site"}
              </button>
            ))}
          </div>
          <div className="dm-search board-search">
            <SearchIcon />
            <input
              ref={searchInput}
              className="dm-input"
              type="search"
              data-testid={TEST_IDS.boardSearch}
              placeholder="Search notes"
              aria-label="Search notes"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
            />
            {query && (
              <button type="button" className="board-search__clear" aria-label="Clear search" onClick={() => setQuery("")}>
                <CloseIcon />
              </button>
            )}
          </div>
          <span className="bar__spacer" />
          <button
            type="button"
            role="switch"
            aria-checked={editing}
            className="board-switch"
            data-testid={TEST_IDS.boardEditSwitch}
            onClick={() => {
              setEditMode(editing ? "off" : "on");
              track("board_edit_mode_changed", { editing: !editing });
            }}
          >
            <span className="board-switch__track" aria-hidden="true">
              <span className="board-switch__thumb" />
            </span>
            Edit notes
          </button>
          <span className="board-bar__count" aria-live="polite">
            {matches
              ? `${matches.size} of ${records.length} ${records.length === 1 ? "note" : "notes"}`
              : `${records.length} ${records.length === 1 ? "note" : "notes"}`}
          </span>
        </header>
        {records.length === 0 ? (
          <div className="board-empty">
            <h1 className="view-title">No notes yet</h1>
            <p>Notes you add on any website show up here, grouped by their tags or by website.</p>
          </div>
        ) : view === "board" ? (
          <BoardView records={records} tags={tags} editing={editing} matches={matches} track={track} />
        ) : view === "sites" ? (
          <SitesView records={records} tags={tags} editing={editing} matches={matches} track={track} />
        ) : (
          <TagsView records={records} tags={tags} editing={editing} matches={matches} track={track} />
        )}
      </div>
      {opened && (
        <NoteDialog
          record={opened}
          tags={tagsOfNote(tags, opened.note)}
          editing={editing}
          onClose={() => setOpenId(null)}
          onFind={() => {
            track("board_find_on_page", { from: "opened_note" });
            findOnPage(opened);
          }}
        />
      )}
      {/* A survey from PostHog, if there's one for this install */}
      <div className="board-survey">
        <SurveyPrompt surface="board" />
      </div>
     </OpenNote.Provider>
    </UndoProvider>
  );
};
