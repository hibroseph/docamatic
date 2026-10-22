// The popup and the side panel: one app, two layouts.
//
// Popup: quick actions and short lists. New note puts a note on the page and
// closes the popup so you can start typing.
// Side panel (a preview): notes beside the page you're reading. New note
// there adds a note that stays in the panel; any note can go on the page
// from its menu.
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TEST_IDS } from "../utils/testIds";
import { trackEvent } from "../redux/actions";
import type { State, Tag } from "../model/types";
import { isEmptyQuery, type SearchQuery } from "../model/search";
import { TagPill } from "../ui/NoteParts";
import { BoardIcon, CloseIcon, GearIcon, PanelIcon, PlusIcon, SearchIcon } from "../ui/icons";
import { UndoProvider } from "../ui/undo";
import {
  canKeepInstead,
  canRetryAfterReload,
  createFailureMessage,
  createNote,
  reloadTab,
  openSidePanel,
  sidePanelSupported,
  useActiveTab,
  useNewNoteShortcut,
  useRemembered,
  useTheme,
  type Surface,
} from "./hooks";
import { AllNotesView, FavoritesView, SearchResultsView, TagNotesView, TagsView, ThisPageView } from "./views";
import { Settings } from "./Settings";
import { SurveyPrompt } from "./Survey";

type Tab = "current" | "all" | "hearted" | "tags";

// The test ids keep the names of the old popup's sections ("sort" was the
// sorted list of all notes), which the upgrade test uses
const TABS: { id: Tab; label: string; testName: string }[] = [
  { id: "current", label: "This page", testName: "current" },
  { id: "all", label: "All notes", testName: "sort" },
  { id: "hearted", label: "Favorites", testName: "hearted" },
  { id: "tags", label: "Tags", testName: "tags" },
];

const NO_TAGS: Tag[] = [];

export const App = ({ surface }: { surface: Surface }) => {
  useTheme();
  const dispatch = useDispatch();
  const safeMode = useSelector((state: State) => state.metadata?.safe_mode);
  const tags = useSelector((state: State) => state.tags) || NO_TAGS;
  const activeTab = useActiveTab(surface === "sidepanel");
  const shortcut = useNewNoteShortcut();

  const [tab, setTabRaw] = useRemembered<Tab>(`${surface}:tab`, "current");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openTag, setOpenTag] = useState<Tag | null>(null);
  const [query, setQuery] = useState<SearchQuery>({ text: "", tagIds: [] });
  const [searchFocused, setSearchFocused] = useState(false);
  // Why the last new note couldn't go on the page, and where it was meant to go
  const [failure, setFailure] = useState<{ reason: string; placement: "page" | "panel" } | null>(null);
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  const searching = !isEmptyQuery(query);

  const setTab = (next: Tab) => {
    setTabRaw(next);
    setOpenTag(null);
    setSettingsOpen(false);
    // Which parts of the popup people actually use
    dispatch(trackEvent("popup_page_viewed", { page: next, surface }));
  };

  // "/" searches, Escape clears the search
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement)?.closest?.("input, textarea, [contenteditable]");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const newNote = async (placement: "page" | "panel") => {
    setFailure(null);
    setBusy(true);
    const result = await createNote(activeTab, placement, surface);
    setBusy(false);
    if (!result.ok) {
      setFailure({ reason: result.reason, placement });
      return false;
    }
    showNewNote(result.noteId, placement);
    return true;
  };

  // When a note can't go on the page, people can still get somewhere: reload
  // the page and try again (fixes a page whose connection to Docamatic
  // broke), or keep the note in Docamatic, saved with the page, and write it
  // right here. `note_create_recovery` says which, and whether it worked.
  const retryAfterReload = async () => {
    if (!failure || !activeTab?.id) return;
    const { reason, placement } = failure;
    setBusy(true);
    await reloadTab(activeTab.id);
    const ok = await newNote(placement);
    dispatch(trackEvent("note_create_recovery", { action: "reload", reason, ok, surface }));
  };

  const keepInstead = async () => {
    if (!failure) return;
    const { reason } = failure;
    const ok = await newNote("panel");
    dispatch(trackEvent("note_create_recovery", { action: "keep_in_docamatic", reason, ok, surface }));
  };

  const showNewNote = (noteId: string, placement: "page" | "panel") => {
    if (surface === "popup" && placement === "page") {
      // The note is on the page with the cursor in it; get out of the way
      window.close();
    } else {
      setQuery({ text: "", tagIds: [] });
      setSettingsOpen(false);
      setTab("current");
      setFocusNoteId(noteId);
    }
  };

  // The background couldn't load the notes safely (see safe mode in
  // background/startBackground.js), so nothing here would work
  if (safeMode) {
    return (
      <div className={`shell shell--${surface}`}>
        <div className="safe-mode" data-testid={TEST_IDS.popupSafeModeBanner} role="alert">
          <h1 className="view-title">Docamatic is in safe mode</h1>
          <p>
            Your notes couldn't be loaded safely after an update, so Docamatic isn't showing or changing them. They are
            still saved on this computer.
          </p>
          <p>
            Please download a backup and email it to <a href="mailto:sticknoteapp@gmail.com">sticknoteapp@gmail.com</a>{" "}
            so we can help.
          </p>
          <button type="button" className="dm-btn dm-btn--primary" onClick={() => chrome.runtime.openOptionsPage()}>
            Backup &amp; restore
          </button>
        </div>
      </div>
    );
  }

  const selectedTags = tags.filter((tag) => query.tagIds.includes(tag.id));
  const availableTags = tags.filter((tag) => !query.tagIds.includes(tag.id)).sort((a, b) => a.text.localeCompare(b.text));
  const showTagFilters = (searchFocused || searching) && availableTags.length > 0;

  const primaryPlacement = surface === "sidepanel" ? "panel" : "page";

  return (
    <UndoProvider>
      <div className={`shell shell--${surface}`}>
        <header className="bar">
          <span className="wordmark">Docamatic</span>
          {surface === "sidepanel" && <span className="dm-tag dm-tag--blue preview-tag">Preview</span>}
          <span className="bar__spacer" />
          <button
            type="button"
            className="dm-btn dm-btn--ghost dm-btn--icon"
            aria-label="Open the board: all notes, grouped by tag"
            title="Board: all your notes, grouped by tag (preview)"
            data-testid={TEST_IDS.popupOpenBoard}
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL("/board.html") });
              if (surface === "popup") window.close();
            }}
          >
            <BoardIcon />
          </button>
          {surface === "popup" && sidePanelSupported() && (
            <button
              type="button"
              className="dm-btn dm-btn--ghost dm-btn--icon"
              aria-label="Open notes in the side panel"
              title="Open notes in the side panel (preview)"
              onClick={() => openSidePanel()}
            >
              <PanelIcon />
            </button>
          )}
          <button
            type="button"
            className="dm-btn dm-btn--ghost dm-btn--icon"
            aria-label="Settings"
            aria-pressed={settingsOpen}
            title="Settings"
            data-testid={TEST_IDS.popupNav("settings")}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <GearIcon />
          </button>
        </header>

        {settingsOpen ? (
          <main className="content">
            <Settings onBack={() => setSettingsOpen(false)} surface={surface} />
          </main>
        ) : (
          <>
            <div className="actions">
              <button
                type="button"
                className="dm-btn dm-btn--primary new-note"
                data-testid={TEST_IDS.popupNav("new")}
                disabled={busy}
                onClick={() => newNote(primaryPlacement)}
              >
                <PlusIcon />
                {surface === "sidepanel" ? "New note" : "New note on this page"}
                {surface === "popup" && shortcut && <kbd className="new-note__kbd">{shortcut}</kbd>}
              </button>
              {surface === "sidepanel" && (
                <button
                  type="button"
                  className="dm-btn"
                  disabled={busy}
                  title="Add a note on the page instead of in the panel"
                  onClick={() => newNote("page")}
                >
                  On the page
                </button>
              )}
            </div>
            {failure && (
              <div className="create-failure" role="alert" data-testid={TEST_IDS.popupCreateFailure}>
                <p className="error">{createFailureMessage(failure.reason)}</p>
                {(canRetryAfterReload(failure.reason) || canKeepInstead(failure.reason, activeTab)) && (
                  <div className="create-failure__actions">
                    {canRetryAfterReload(failure.reason) && (
                      <button type="button" className="dm-btn dm-btn--sm" disabled={busy} data-testid={TEST_IDS.popupRetryAfterReload} onClick={retryAfterReload}>
                        Reload the page and try again
                      </button>
                    )}
                    {canKeepInstead(failure.reason, activeTab) && failure.placement === "page" && (
                      <button type="button" className="dm-btn dm-btn--sm" disabled={busy} data-testid={TEST_IDS.popupKeepNoteInstead} onClick={keepInstead}>
                        Keep a note here instead
                      </button>
                    )}
                  </div>
                )}
                {canKeepInstead(failure.reason, activeTab) && failure.placement === "page" && (
                  <p className="create-failure__hint">A note kept here is saved with this page: it's under <strong>This page</strong> whenever you're on it.</p>
                )}
              </div>
            )}

            <div className="search-area">
              <div className="dm-search search" data-testid={TEST_IDS.popupNav("search")} onClick={() => searchInput.current?.focus()}>
                <SearchIcon />
                <input
                  ref={searchInput}
                  className="dm-input"
                  type="search"
                  data-testid={TEST_IDS.searchInput}
                  placeholder="Search all your notes"
                  aria-label="Search all your notes"
                  value={query.text}
                  onChange={(event) => setQuery({ ...query, text: event.target.value })}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={(event) => {
                    if (!(event.relatedTarget as HTMLElement | null)?.closest?.(".tag-filters")) setSearchFocused(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && searching) {
                      event.preventDefault();
                      setQuery({ text: "", tagIds: [] });
                    }
                  }}
                />
                {searching && (
                  <button
                    type="button"
                    className="search__clear"
                    aria-label="Clear search"
                    onClick={() => setQuery({ text: "", tagIds: [] })}
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>
              {selectedTags.length > 0 && (
                <div className="tag-filters tag-filters--selected" aria-label="Showing notes with">
                  {selectedTags.map((tag) => (
                    <TagPill
                      key={tag.id}
                      tag={tag}
                      testId={TEST_IDS.searchSelectedTag}
                      onRemove={() => setQuery({ ...query, tagIds: query.tagIds.filter((id) => id !== tag.id) })}
                    />
                  ))}
                </div>
              )}
              {showTagFilters && (
                <div className="tag-filters" aria-label="Filter by tag">
                  <span className="tag-filters__label">Tags</span>
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="tag-filter"
                      data-testid={TEST_IDS.searchAvailableTag}
                      data-tag-text={tag.text}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setQuery({ ...query, tagIds: [...query.tagIds, tag.id] })}
                    >
                      <TagPill tag={tag} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!searching && (
              <nav className="tabs-wrap" aria-label="Notes">
                <div className="dm-tabs tabs" role="tablist">
                  {TABS.map(({ id, label, testName }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      className="dm-tab"
                      aria-selected={tab === id}
                      data-testid={TEST_IDS.popupNav(testName)}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </nav>
            )}

            {surface === "popup" && !searching && <SurveyPrompt surface={surface} />}
            <main className="content" role={searching ? "region" : "tabpanel"} aria-label={searching ? "Search results" : undefined}>
              {searching ? (
                <SearchResultsView query={query} />
              ) : tab === "current" ? (
                <ThisPageView tab={activeTab} surface={surface} focusNoteId={focusNoteId} onCreate={() => newNote(primaryPlacement)} />
              ) : tab === "all" ? (
                <AllNotesView surface={surface} />
              ) : tab === "hearted" ? (
                <FavoritesView />
              ) : openTag ? (
                <TagNotesView tag={openTag} onBack={() => setOpenTag(null)} />
              ) : (
                <TagsView onOpenTag={setOpenTag} />
              )}
            </main>
          </>
        )}
      </div>
    </UndoProvider>
  );
};
