// The views of the popup and side panel: this page, all notes, favorites,
// tags, and search results.
import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TEST_IDS } from "../utils/testIds";
import { canHaveNotes } from "../utils/expectedFailures";
import type { NoteRecord, State, Tag } from "../model/types";
import { SORT_LABELS, allNotes, domainOf, lastChanged, notesForPage, pageLabel, plainText, sortNotes, tagCounts, type SortMode } from "../model/notes";
import { searchNotes, type SearchQuery } from "../model/search";
import { NOTE_COLOR_NAMES, HIGHLIGHTER, COLOR_LABELS, tagColorName } from "../model/colors";
import { deleteTag, showNoteOn, updateTag } from "../redux/actions";
import { noteUrlFor, patternBase, sharedPattern } from "../utils/noteUrl";
import { sameSite } from "../utils/sameSite";
import { useDismiss, TagPill } from "../ui/NoteParts";
import { BackIcon, MoreIcon, PencilIcon, TrashIcon } from "../ui/icons";
import { useUndo } from "../ui/undo";
import { EmptyState, GroupedNoteList, NoteList } from "./lists";
import { bringNoteHere, openBoard, useNotePlaces, useRemembered, type Surface } from "./hooks";

const NO_TAGS: Tag[] = [];

// --- This page --------------------------------------------------------------------

export const ThisPageView = ({
  tab,
  surface,
  focusNoteId,
  onCreate,
}: {
  tab: chrome.tabs.Tab | null | undefined;
  surface: Surface;
  focusNoteId: string | null;
  onCreate: () => void;
}) => {
  const url = tab?.url;
  const pages = useSelector((state: State) => state.pages);
  const places = useNotePlaces(tab);
  // Top to bottom, the order they're in on the page
  const records = useMemo(
    () =>
      [...notesForPage({ pages }, url)].sort(
        (a, b) => (a.note.position?.y ?? 0) - (b.note.position?.y ?? 0) || (a.note.position?.x ?? 0) - (b.note.position?.x ?? 0)
      ),
    [pages, url]
  );

  if (tab === undefined) return null;

  // Browser pages (no address here) and extension stores can't have notes on
  // them. Notes kept in Docamatic for a store page ("Keep a note here
  // instead") are still listed below.
  if (!url || (!canHaveNotes(url) && records.length === 0)) {
    return (
      <EmptyState
        before="Notes can't go on this page"
        text={
          url
            ? "This page doesn't allow extensions. You can still keep a note about it in Docamatic: click New note on this page."
            : "Browser pages don't allow it. Open any website to add a note, or look through your notes in the other tabs."
        }
      />
    );
  }

  return (
    <>
      <div className="view-head">
        <h1 className="view-head__title" title={tab?.title}>
          {tab?.title || domainOf(url)}
        </h1>
        <span className="view-head__meta">
          {domainOf(url)}
          {records.length > 0 && ` · ${records.length} note${records.length === 1 ? "" : "s"}`}
        </span>
      </div>
      {records.length === 0 ? (
        <EmptyState
          before="No notes on this page"
          swipe="yet"
          text={
            surface === "sidepanel"
              ? "Notes you add here stay beside the page while you read. Put any of them on the page from its menu."
              : "Jot down what you want to remember while you read. Notes stay right where you put them."
          }
        >
          <button type="button" className="dm-btn" data-testid={TEST_IDS.popupCreateNote} onClick={onCreate}>
            Add a note
          </button>
        </EmptyState>
      ) : null}
      {records.length === 0 ? (
        <LostNotes url={url} />
      ) : (
        <NoteList
          records={records}
          showPage={false}
          focusNoteId={focusNoteId}
          places={places}
          onBringHere={(record) => bringNoteHere(tab, record.note.id)}
        />
      )}
    </>
  );
};

// --- Can't find a note? --------------------------------------------------------------
// On a page without notes: the notes from elsewhere on the same site, each
// with a way to show it here. Notes "disappear" when a site moves the same
// thing to another address (Marketplace's search, a renamed page), and this
// is where people look for them.

const LOST_NOTES_SHOWN = 5;

const pathDepth = (pattern: string) => patternBase(pattern).split("/").length;

const LostNotes = ({ url }: { url: string }) => {
  const dispatch = useDispatch();
  const pages = useSelector((state: State) => state.pages);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(LOST_NOTES_SHOWN);
  // Closest first (most of the address in common), then the newest
  const candidates = useMemo(
    () =>
      allNotes({ pages })
        .filter(({ pageUrl }) => sameSite(pageUrl, url))
        .map((record) => {
          const writtenOn = record.note.created_on_url || patternBase(record.pageUrl);
          return { record, shared: sharedPattern(writtenOn, url) || "" };
        })
        .sort((a, b) => pathDepth(b.shared) - pathDepth(a.shared) || lastChanged(b.record.note) - lastChanged(a.record.note)),
    [pages, url]
  );
  if (candidates.length === 0) return null;

  const site = domainOf(url);
  const show = (record: NoteRecord, to: string) => dispatch(showNoteOn(record.note.id, record.pageUrl, to, "lost_note"));

  return (
    <section className="lost-notes" aria-label="Notes elsewhere on this site">
      <button type="button" className="link-button lost-notes__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        Can't find a note? You have {candidates.length} on other pages of {site}.
      </button>
      {open && (
        <>
          <p className="lost-notes__text">
            Sites sometimes show the same thing at a new address. Pick a note to show it here, and on pages like this one.
          </p>
          <ul className="lost-notes__list">
            {candidates.slice(0, shown).map(({ record, shared }) => {
              const { note } = record;
              const title = note.title?.trim() || plainText(note.body).split("\n")[0] || "Untitled note";
              // The pages it and this page have in common; just the site
              // itself is too broad to suggest first
              const sharesFolder = pathDepth(shared) > pathDepth(`${new URL(url).origin}/*`);
              const everyPage = pageLabel(undefined, shared).replace(/^All of /, "every page of ");
              return (
                <li key={note.id} className="lost-note" data-testid={TEST_IDS.lostNote} data-note-id={note.id}>
                  <span className="lost-note__title">{title}</span>
                  <span className="lost-note__where">On {pageLabel({ pages }, record.pageUrl)}</span>
                  <span className="lost-note__actions">
                    <button
                      type="button"
                      className={`dm-btn dm-btn--sm ${sharesFolder ? "" : "dm-btn--ghost"}`}
                      data-testid={TEST_IDS.lostNoteShowHere}
                      onClick={() => show(record, shared)}
                    >
                      Show on {everyPage}
                    </button>
                    <button
                      type="button"
                      className={`dm-btn dm-btn--sm ${sharesFolder ? "dm-btn--ghost" : ""}`}
                      data-testid={TEST_IDS.lostNoteMoveHere}
                      onClick={() => show(record, noteUrlFor(url))}
                    >
                      Move to this page
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
          {candidates.length > shown && (
            <button type="button" className="dm-btn dm-btn--ghost dm-btn--sm" onClick={() => setShown(shown + LOST_NOTES_SHOWN)}>
              Show {Math.min(LOST_NOTES_SHOWN, candidates.length - shown)} more
            </button>
          )}
        </>
      )}
    </section>
  );
};

// --- All notes ----------------------------------------------------------------------

export const AllNotesView = ({ surface }: { surface: Surface }) => {
  const pages = useSelector((state: State) => state.pages);
  const [sort, setSort] = useRemembered<SortMode>(`${surface}:sort`, "newest");
  const records = useMemo(() => sortNotes(allNotes({ pages }), sort), [pages, sort]);

  if (records.length === 0) {
    return (
      <EmptyState
        before="Your notes will show up"
        swipe="here"
        text="Add a note to any web page and you'll find it here, with everything else you've written."
      />
    );
  }

  return (
    <>
      <div className="list-head">
        <span className="list-head__count">
          {records.length} note{records.length === 1 ? "" : "s"}
          {records.length > 1 && (
            <>
              {" · "}
              <button type="button" className="link-button" data-testid={TEST_IDS.allNotesOpenBoard} onClick={() => openBoard("all_notes", surface)}>
                See them all on the board
              </button>
            </>
          )}
        </span>
        <label className="sort">
          <span className="visually-hidden">Sort notes</span>
          <select className="dm-input sort__select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
              <option key={mode} value={mode}>
                {SORT_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {sort === "site" ? <GroupedNoteList records={records} /> : <NoteList records={records} />}
    </>
  );
};

// --- Favorites ------------------------------------------------------------------------

export const FavoritesView = () => {
  const pages = useSelector((state: State) => state.pages);
  const records = useMemo(() => sortNotes(allNotes({ pages }).filter(({ note }) => note.heart), "newest"), [pages]);
  if (records.length === 0) {
    return (
      <EmptyState
        before="No favorites"
        swipe="yet"
        text="Tap the heart on any note to keep it here, one click away from wherever you are."
      />
    );
  }
  return <NoteList records={records} />;
};

// --- Tags ---------------------------------------------------------------------------

export const TagsView = ({ onOpenTag }: { onOpenTag: (tag: Tag) => void }) => {
  const tags = useSelector((state: State) => state.tags) || NO_TAGS;
  const pages = useSelector((state: State) => state.pages);
  const counts = useMemo(() => tagCounts({ pages, tags }), [pages, tags]);
  const sorted = [...tags].sort((a, b) => a.text.localeCompare(b.text));

  if (tags.length === 0) {
    return (
      <EmptyState
        before="No tags"
        swipe="yet"
        text="Type a tag on any note, like “recipes” or “to read”, to group notes from different sites. They'll be listed here."
      />
    );
  }

  return (
    <>
      <p className="list-hint">Pick a tag to see its notes. Rename or recolor a tag and it changes on every note.</p>
      <ul className="tag-list">
        {sorted.map((tag) => (
          <TagRow key={tag.id} tag={tag} count={counts[tag.id] || 0} onOpen={() => onOpenTag(tag)} />
        ))}
      </ul>
    </>
  );
};

const TagRow = ({ tag, count, onOpen }: { tag: Tag; count: number; onOpen: () => void }) => {
  const dispatch = useDispatch();
  const offerUndo = useUndo();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(tag.text);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  useDismiss(menuOpen, () => setMenuOpen(false), menuRef, moreRef);

  const finishRename = () => {
    setRenaming(false);
    if (name.trim() && name.trim() !== tag.text) dispatch(updateTag(tag.id, { text: name.trim() }));
    else setName(tag.text);
  };

  return (
    <li className="tag-row">
      {renaming ? (
        <input
          className="dm-input tag-row__rename"
          value={name}
          autoFocus
          aria-label={`New name for ${tag.text}`}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          onBlur={finishRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") finishRename();
            if (event.key === "Escape") {
              setName(tag.text);
              setRenaming(false);
            }
          }}
        />
      ) : (
        <button type="button" className="tag-row__open" onClick={onOpen}>
          <TagPill tag={tag} />
          <span className="tag-row__count">
            {count} note{count === 1 ? "" : "s"}
          </span>
        </button>
      )}
      <div className="tag-row__menu-anchor">
        <button
          type="button"
          ref={moreRef}
          className="dm-btn dm-btn--ghost dm-btn--icon"
          aria-label={`Options for ${tag.text}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreIcon />
        </button>
        <div className="menu tag-menu" role="menu" hidden={!menuOpen} ref={menuRef}>
          <div className="menu__label">Color</div>
          <div className="swatches" role="radiogroup" aria-label="Tag color">
            {NOTE_COLOR_NAMES.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={tagColorName(tag.color) === color}
                aria-label={COLOR_LABELS[color]}
                title={COLOR_LABELS[color]}
                className="swatch"
                style={{ background: HIGHLIGHTER[color] }}
                onClick={() => dispatch(updateTag(tag.id, { color: HIGHLIGHTER[color] }))}
              />
            ))}
          </div>
          <div className="menu__sep" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={() => {
              setMenuOpen(false);
              setRenaming(true);
            }}
          >
            <PencilIcon /> Rename
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item menu__item--danger"
            onClick={() => {
              setMenuOpen(false);
              if (count > 0 && !confirm(`Remove the tag “${tag.text}” from ${count} note${count === 1 ? "" : "s"}? The notes stay.`)) return;
              dispatch(deleteTag(tag.id));
              offerUndo(`Tag “${tag.text}” deleted.`);
            }}
          >
            <TrashIcon /> Delete tag
          </button>
        </div>
      </div>
    </li>
  );
};

export const TagNotesView = ({ tag, onBack }: { tag: Tag; onBack: () => void }) => {
  const pages = useSelector((state: State) => state.pages);
  const tags = useSelector((state: State) => state.tags) || NO_TAGS;
  const live = tags.find((t) => t.id === tag.id);
  const records = useMemo(() => searchNotes({ pages, tags }, { text: "", tagIds: [tag.id] }), [pages, tags, tag.id]);
  return (
    <>
      <div className="list-head">
        <button type="button" className="dm-btn dm-btn--ghost dm-btn--sm back" onClick={onBack}>
          <BackIcon /> All tags
        </button>
        {live && <TagPill tag={live} />}
      </div>
      {records.length === 0 ? (
        <EmptyState before="No notes with this tag" text="Notes you tag with it will show up here." />
      ) : (
        <NoteList records={records} />
      )}
    </>
  );
};

// --- Search -------------------------------------------------------------------------

export const SearchResultsView = ({ query }: { query: SearchQuery }) => {
  const pages = useSelector((state: State) => state.pages);
  const tags = useSelector((state: State) => state.tags) || NO_TAGS;
  const records: NoteRecord[] = useMemo(() => searchNotes({ pages, tags }, query), [pages, tags, query.text, query.tagIds.join()]);

  if (records.length === 0) {
    return (
      <EmptyState
        before={query.text.trim() ? `Nothing matches “${query.text.trim()}”` : "No notes with these tags"}
        text="Try fewer words, check the spelling, or remove a tag filter."
      />
    );
  }
  return (
    <>
      <div className="list-head">
        <span className="list-head__count">
          {records.length} note{records.length === 1 ? "" : "s"}
        </span>
      </div>
      <NoteList records={records} />
    </>
  );
};
