// All the notes on the current page. Rendered by the notes UI on web pages,
// and by the demos on the website and the welcome page (with a local store).
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onUrlChange } from "../utils/urlChanges";
import { notesForPage, tagsOfNote } from "../model/notes";
import type { NoteRecord, State, Tag } from "../model/types";
import { fillNoteDetails, setPageTitle } from "../redux/actions";
import { isPagePattern, noteUrlFor, redactUrl } from "../utils/noteUrl";
import { NoRenderErrorBoundary } from "../ui/NoRenderErrorBoundary";
import { StickyNote } from "./StickyNote";
import { reportNewlyShownNotes } from "./reportShown";

declare global {
  interface Window {
    navigation?: EventTarget;
  }
}

const NO_TAGS: Tag[] = [];

// A note this new was just added, so it gets the cursor
const JUST_CREATED_MS = 5000;

/** The page's address, following single page app navigation */
const useCurrentUrl = () => {
  const [url, setUrl] = useState(location.href);
  useEffect(() => {
    const update = () => setUrl(location.href);
    // The background reports url changes the browser sees (the reliable
    // source); the listeners below catch them a little sooner where they can
    const stopListening = onUrlChange(update);
    // The Navigation API reports every same-document navigation, including
    // history.pushState from the page's own scripts (Chrome 102+)
    window.navigation?.addEventListener("navigatesuccess", update);
    // Fallback for anything the above misses: most SPA navigations start with
    // a click. Setting the same url doesn't re-render.
    const onClick = () => requestAnimationFrame(update);
    document.addEventListener("click", onClick, true);
    // Back/forward buttons
    window.addEventListener("popstate", update);
    return () => {
      stopListening();
      window.navigation?.removeEventListener("navigatesuccess", update);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", update);
    };
  }, []);
  return url;
};

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    let frame = 0;
    // Resize fires many times per second while dragging the window edge;
    // re-render at most once per frame
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setWidth(window.innerWidth);
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);
  return width;
};

// Collected from every url the page's notes may be saved under (see
// utils/noteUrl.js). The result is reused while those note arrays are
// unchanged, so updates to other pages' notes don't re-render this page.
const usePageNotes = (url: string) => {
  const cache = useRef<{ sources: unknown[]; records: NoteRecord[] }>({ sources: [], records: [] });
  return useSelector((state: State) => {
    const records = notesForPage(state, url);
    const sources = records.map((record) => record.note);
    const same =
      sources.length === cache.current.sources.length && sources.every((note, i) => note === cache.current.sources[i]);
    if (!same) cache.current = { sources, records };
    return cache.current.records;
  });
};

/** Saves the page's title with its notes, so lists can show it instead of the url */
const useSavePageTitle = (records: NoteRecord[], url: string, enabled: boolean) => {
  const dispatch = useDispatch();
  // Not patterns: their notes show on many pages, each with its own title
  const pageUrls = [...new Set(records.map((record) => record.pageUrl).filter((pageUrl) => !isPagePattern(pageUrl)))].join(" ");
  const titles = useSelector((state: State) => pageUrls.split(" ").map((pageUrl) => state.pages?.[pageUrl]?.title).join("\n"));
  useEffect(() => {
    if (!enabled || !pageUrls) return;
    // Single page apps update the title a moment after the url
    const timer = setTimeout(() => {
      const title = document.title.trim();
      if (!title) return;
      const saved = titles.split("\n");
      pageUrls.split(" ").forEach((pageUrl, i) => {
        if (saved[i] !== title) dispatch(setPageTitle(pageUrl, title));
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [pageUrls, url]);
};

/**
 * Gives notes saved by older versions the details they're missing, now that
 * the page is open (see FILLABLE_NOTE_DETAILS in redux/reducer.js). Only
 * notes saved under exactly this page's address: one shown here under an
 * older, broader address may have been written on a different page.
 */
const useFillMissingDetails = (records: NoteRecord[], url: string, enabled: boolean) => {
  const dispatch = useDispatch();
  const missing = records.filter(({ note, pageUrl }) => !note.created_on_url && pageUrl === noteUrlFor(url));
  const key = missing.map(({ note }) => note.id).join(" ");
  useEffect(() => {
    if (!enabled || !key) return;
    const createdOn = redactUrl(url);
    if (!createdOn) return;
    missing.forEach(({ note, pageUrl }) => dispatch(fillNoteDetails(pageUrl, note.id, { created_on_url: createdOn })));
  }, [key, url]);
};

export const PageNotes = ({ disconnected = false, saveTitles = true }: { disconnected?: boolean; saveTitles?: boolean }) => {
  const url = useCurrentUrl();
  const windowWidth = useWindowWidth();
  const records = usePageNotes(url);
  const tags = useSelector((state: State) => state.tags) || NO_TAGS;
  const textSize = useSelector((state: State) => state.metadata?.preferences?.note_text_size) || "medium";
  const [onTop, setOnTop] = useState<string | null>(null);
  // Notes already on the page when it loaded (or when they were first seen)
  // don't take the cursor; only ones added just now do
  const seen = useRef(new Set<string>());

  useSavePageTitle(records, url, saveTitles);
  useFillMissingDetails(records, url, saveTitles);

  // After rendering, so "shown" means actually on the page
  useEffect(() => {
    reportNewlyShownNotes(records);
    records.forEach(({ note }) => seen.current.add(note.id));
  }, [records]);

  return (
    <div className="page-notes" data-text-size={textSize}>
      {records
        .filter(({ note }) => note.visible !== false)
        .map((record) => {
          const { note } = record;
          const autoFocus = !seen.current.has(note.id) && Date.now() - Number(note.date_created) < JUST_CREATED_MS;
          return (
            <NoRenderErrorBoundary key={note.id}>
              <StickyNote
                record={record}
                tags={tagsOfNote(tags, note)}
                windowWidth={windowWidth}
                zIndex={onTop === note.id ? 1 : 0}
                onBringToFront={() => setOnTop(note.id)}
                disconnected={disconnected}
                autoFocus={autoFocus}
              />
            </NoRenderErrorBoundary>
          );
        })}
    </div>
  );
};
