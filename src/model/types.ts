// The shape of the saved notes state (chrome.storage.local), as every version
// since 2022 has written it. Fields marked "since 5.1" are optional and
// additive: older notes don't have them, and 5.0.0 ignores them, so they
// didn't need a schema migration (see redux/migrations.js).
//
// UI code should not walk `pages` itself; use the selectors in model/notes.ts.
// That keeps the storage layout in one place, so it can change later (see the
// "item model" plans in ideas.md) without touching every view.

import type { NoteColorName } from "./colors";

export interface NoteColor {
  /** Since 5.1: one of the design system's note colors. Absent on older notes. */
  name?: NoteColorName;
  /** The note's color. Before 5.1: the title bar color; since 5.1 also the note paper. */
  title: string;
  /** Text color on `title` */
  text: string;
  /** Since 5.1: a pre-5.1 note's first color, after it was changed to a new one */
  original?: string;
}

/**
 * Since 5.1: what a note moves with when things scroll (page/anchor.ts).
 * Absent: the page, as every older note. `position` is kept either way.
 */
export type NoteAnchor =
  /**
   * Inside a scrolling panel or on a sticky part of the page; x/y within its
   * (scrolled) content; w its width then, to check it's the same element later
   */
  | { kind: "element"; selector: string; x: number; y: number; w?: number }
  /** Over something fixed; x/y on screen */
  | { kind: "viewport"; x: number; y: number };

export interface Note {
  id: string;
  /** Page coordinates of the note's top left corner, in CSS pixels */
  position: { x: number; y: number };
  size: { width: number };
  title: string | null;
  /** HTML from the note editor (sanitized before it's rendered) */
  body: string | null;
  date_created: number;
  /** Since 5.1: last change to the title, body, color or tags (ms) */
  updated_at?: number;
  color: NoteColor;
  /** Favorite */
  heart?: boolean;
  /** Shown on the page. False: only in the popup and side panel. */
  visible?: boolean;
  /** Since 5.1, see NoteAnchor */
  anchor?: NoteAnchor;
  /** Pinned to the window instead of the page (no UI to set it today) */
  stickify?: boolean;
  /** Tag ids, mirrored by Tag.notes */
  tags?: { id: string }[];
  /** The full address the note was created on, credentials removed */
  created_on_url?: string;
}

export interface Page {
  notes: Note[];
  /** Since 5.1: the page's title, saved when a note is added or the page is visited */
  title?: string;
}

export interface Tag {
  id: string;
  text: string;
  /** Hex color. Since 5.1 new tags get a highlighter color (model/colors.ts). */
  color: string;
  /** Ids of the notes with this tag, mirrored by Note.tags */
  notes: string[];
}

export type ThemePreference = "system" | "light" | "dark";

export interface Preferences {
  theme?: ThemePreference;
  new_note_color?: NoteColorName;
  /** Notes move with scrolling panels and fixed parts of pages (page/anchor.ts). Off unless turned on. */
  follow_panels?: boolean;
}

export interface Metadata {
  onboarded?: boolean;
  analytics_enabled?: boolean;
  schema_version?: number;
  /** Since 5.1 */
  preferences?: Preferences;
  /** Never saved: set by the background when notes couldn't be loaded safely */
  safe_mode?: { reason: string; message: string } | null;
}

export interface State {
  pages: Record<string, Page>;
  tags: Tag[];
  metadata: Metadata;
}

/** A note together with the url it's saved under (which edits must use) */
export interface NoteRecord {
  note: Note;
  pageUrl: string;
}
