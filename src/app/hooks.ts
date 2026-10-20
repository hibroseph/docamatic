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
  reason === "page_not_supported"
    ? "Notes can't go on this page. Browser pages and extension stores don't allow it."
    : reason === "safe_mode"
      ? "Docamatic is in safe mode, so it isn't changing notes right now."
      : "Couldn't add a note here. Try reloading the page, then add it again.";

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
