// Browser glue for the popup and side panel.
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CHROME_MESSAGES, CREATE_NOTE_COMMAND } from "../utils/constants";
import type { State, ThemePreference } from "../model/types";

export type Surface = "popup" | "sidepanel";

type Tab = chrome.tabs.Tab;

/**
 * The tab the person is looking at. The side panel stays open while they
 * switch tabs and navigate, so it follows along.
 */
export const useActiveTab = (follow: boolean) => {
  const [tab, setTab] = useState<Tab | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      chrome.tabs.query({ active: true, currentWindow: true }).then(
        ([active]) => !cancelled && setTab(active || null),
        () => !cancelled && setTab(null)
      );
    refresh();
    if (!follow) return () => void (cancelled = true);

    const onActivated = () => refresh();
    const onUpdated = (_id: number, change: { url?: string; title?: string; status?: string }, updated: Tab) => {
      if (updated.active && (change.url || change.title || change.status === "complete")) refresh();
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.windows?.onFocusChanged.addListener(onActivated);
    return () => {
      cancelled = true;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.windows?.onFocusChanged.removeListener(onActivated);
    };
  }, [follow]);

  return tab;
};

/** Applies the theme setting to this page (System follows the OS) */
export const useTheme = () => {
  const theme = useSelector((state: State) => state.metadata?.preferences?.theme) || "system";
  useEffect(() => applyTheme(theme), [theme]);
};

export const applyTheme = (theme: ThemePreference) => {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
};

export type CreateResult = { ok: true; noteId: string; pageUrl: string } | { ok: false; reason: string };

/** Adds a note to the active tab (the background does the work; see background/createNote.js) */
export const createNote = async (tab: Tab | null | undefined, placement: "page" | "panel", source: Surface): Promise<CreateResult> => {
  if (!tab?.id) return { ok: false, reason: "page_not_supported" };
  try {
    const result = await chrome.runtime.sendMessage({ type: CHROME_MESSAGES.CREATE_NOTE, tabId: tab.id, placement, source });
    return result || { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
};

export const createFailureMessage = (reason: string) =>
  reason === "file_access_off"
    ? "To add notes to files on your computer, turn on “Allow access to file URLs” in Docamatic's details on the extensions page."
    : reason === "page_not_supported"
    ? "Notes can't go on this page. Browser pages and extension stores don't allow it."
    : reason === "safe_mode"
      ? "Docamatic is in safe mode, so it isn't changing notes right now."
      : "Couldn't put a note on this page.";

// What can be tried when a note couldn't go on the page. Reloading fixes a
// page whose connection to Docamatic broke (an update, a page that replaced
// itself); it can't help pages the browser doesn't allow or safe mode.
// Keeping the note in Docamatic works for any page whose address is known.
export const canRetryAfterReload = (reason: string) => !["page_not_supported", "file_access_off", "safe_mode"].includes(reason);
export const canKeepInstead = (reason: string, tab: Tab | null | undefined) => reason !== "safe_mode" && Boolean(tab?.url);

/** Reloads a tab and resolves once it has loaded again (or after `ms`) */
export const reloadTab = (tabId: number, ms = 15000) =>
  new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    };
    const onUpdated = (id: number, change: { status?: string }) => {
      if (id === tabId && change.status === "complete") done();
    };
    const timer = setTimeout(done, ms);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.reload(tabId).catch(done);
  });

/** The keyboard shortcut for a new note, as set in the browser (it can be changed or removed) */
export const useNewNoteShortcut = () => {
  const [shortcut, setShortcut] = useState("");
  useEffect(() => {
    chrome.commands
      ?.getAll()
      .then((commands) => setShortcut(commands.find((c) => c.name === CREATE_NOTE_COMMAND)?.shortcut || ""))
      .catch(() => {});
  }, []);
  return shortcut;
};

/**
 * Goes to a note on its page ("Find on page"). The popup closes so the page
 * can be seen; the side panel stays open beside it.
 */
export const findOnPage = ({ note, pageUrl }: { note: { id: string }; pageUrl: string }) => {
  chrome.runtime.sendMessage({ type: CHROME_MESSAGES.FIND_NOTE, noteId: note.id, pageUrl }).catch(() => {});
  if (document.body.classList.contains("surface-popup")) window.close();
};

export type NotePlace = "visible" | "below" | "above" | "aside" | "away";

/**
 * Where each note on the open page is (on screen, further down, ...), asked
 * of the page now and then while the popup or side panel is open. Empty for
 * pages without the notes UI.
 */
export const useNotePlaces = (tab: chrome.tabs.Tab | null | undefined) => {
  const [places, setPlaces] = useState<Record<string, NotePlace>>({});
  useEffect(() => {
    if (!tab?.id) return;
    let cancelled = false;
    const ask = () =>
      chrome.tabs
        .sendMessage(tab.id!, { action: CHROME_MESSAGES.NOTE_PLACES })
        .then((reply) => !cancelled && setPlaces(reply?.places || {}))
        .catch(() => !cancelled && setPlaces({}));
    ask();
    const timer = setInterval(ask, 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tab?.id, tab?.url]);
  return places;
};

/** Moves a note on the open page to what's on screen there ("Bring here") */
export const bringNoteHere = (tab: chrome.tabs.Tab | null | undefined, noteId: string) => {
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { action: CHROME_MESSAGES.BRING_NOTE_HERE, noteId }).catch(() => {});
  if (document.body.classList.contains("surface-popup")) window.close();
};

// --- Side panel ------------------------------------------------------------------

declare const browser: { sidebarAction?: { open: () => Promise<void> } } | undefined;

export const sidePanelSupported = () =>
  Boolean(globalThis.chrome?.sidePanel?.open) || Boolean(typeof browser !== "undefined" && browser?.sidebarAction?.open);

// The browser only opens a side panel in direct response to a click, so the
// window id is looked up ahead of time instead of awaited in the handler
let currentWindowId: number | undefined;
globalThis.chrome?.windows?.getCurrent?.().then((win) => (currentWindowId = win.id)).catch(() => {});

export const openSidePanel = () => {
  if (typeof browser !== "undefined" && browser?.sidebarAction?.open) {
    return browser.sidebarAction.open().then(() => window.close());
  }
  if (chrome.sidePanel?.open && currentWindowId !== undefined) {
    return chrome.sidePanel.open({ windowId: currentWindowId }).then(() => window.close());
  }
  return Promise.resolve();
};

/** Remembers a choice (like the sort order) for this surface, in this browser only */
export const useRemembered = <T extends string>(key: string, initial: T): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(`docamatic:${key}`) as T) || initial;
    } catch {
      return initial;
    }
  });
  const set = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(`docamatic:${key}`, next);
    } catch {
      // Not remembered; fine
    }
  };
  return [value, set];
};

/** Opens a page in a new tab */
export const openTab = (url: string) => chrome.tabs.create({ url });
