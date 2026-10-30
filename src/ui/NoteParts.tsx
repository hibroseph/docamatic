// The parts every note is built from, on a page or in a list: title, body,
// tags, colors and the More menu. StickyNote (on pages) and NoteCard (in the
// popup and side panel) arrange them differently, but they're the same
// controls with the same behavior.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ContentEditable from "react-contenteditable";
import DOMPurify from "dompurify";
import { useSelector } from "react-redux";
import { useStoreSyncedText } from "../utils/useStoreSyncedText";
import { TEST_IDS } from "../utils/testIds";
import { safeHref, EXTERNAL_LINK_PROPS } from "../utils/SafeLink";
import { addressPartIndex, addressParts, isPagePattern, patternBase, patternMatches } from "../utils/noteUrl";
import { canHaveNotes } from "../utils/expectedFailures";
import {
  COLOR_LABELS,
  NOTE_COLOR_NAMES,
  NOTE_PAPER,
  contrastingText,
  resolveNoteColor,
  tagColorName,
  type ResolvedNoteColor,
} from "../model/colors";
import type { Note, NoteRecord, State, Tag } from "../model/types";
import { plainText } from "../model/notes";
import type { NoteActions } from "./useNoteActions";
import {
  BringHereIcon,
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  ExternalIcon,
  EyeIcon,
  EyeOffIcon,
  PagesIcon,
  PinIcon,
  TagIcon,
  TargetIcon,
  TrashIcon,
} from "./icons";

// --- Which pages a note shows on ----------------------------------------------

/**
 * What a choice in the pages picker means, in words: "Only this page",
 * "Every page of facebook.com/marketplace", "Every page of facebook.com".
 */
const pagesSummary = (parts: { key: string }[], chosen: number) => {
  if (chosen === parts.length - 1) return "Only this page";
  const base = patternBase(parts[chosen]!.key).replace(/^[a-z]+:\/\/(www\.)?/, "").replace(/\/$/, "");
  return `Every page of ${chosen === 0 ? base.replace(/\/.*/, "") : base}`;
};

/**
 * The address of a page cut into its parts (utils/noteUrl.js addressParts):
 * the site, each folder, and what makes it this page. Picking a part shows
 * the note on every page under it; the parts after it are crossed out. The
 * last part is this page only.
 *
 * `href` is the page the parts come from: the page the note is on, or in
 * lists the page it was written on.
 */
export const PagesPicker = ({
  record,
  href,
  actions,
  onDone,
}: {
  record: NoteRecord;
  href: string;
  actions: NoteActions;
  onDone: () => void;
}) => {
  const parts = addressParts(href);
  const current = (() => {
    const exact = addressPartIndex(parts, record.pageUrl);
    if (exact !== -1) return exact;
    // A pattern broader or narrower than the parts here, or an older key:
    // start from the narrowest part it covers, else this page
    if (isPagePattern(record.pageUrl)) {
      const covered = parts.findIndex((part) => patternMatches(record.pageUrl, patternBase(part.key)));
      if (covered !== -1) return covered;
    }
    return parts.length - 1;
  })();
  const [chosen, setChosen] = useState(current);
  if (parts.length === 0) return null;

  const save = () => {
    actions.showOn(parts[chosen]!.key);
    onDone();
  };

  return (
    <div className="pages-picker" data-testid={TEST_IDS.pagesPicker}>
      <div className="pages-picker__label" id={`pages-${record.note.id}`}>
        Show this note on
      </div>
      <div className="pages-picker__address" role="radiogroup" aria-labelledby={`pages-${record.note.id}`}>
        {parts.map((part, index) => (
          <React.Fragment key={part.key + index}>
            {/* Between folders; the query and "this page" follow without one */}
            {index > 0 && !part.page && !part.text.startsWith("?") && !part.text.startsWith("#") && (
              <span className={`pages-picker__slash ${index > chosen ? "is-dropped" : ""}`} aria-hidden="true">
                /
              </span>
            )}
            <button
              type="button"
              role="radio"
              aria-checked={index === chosen}
              aria-label={`${part.text}: ${pagesSummary(parts, index)}`}
              className={`pages-picker__part ${part.page ? "pages-picker__part--page" : ""} ${index > chosen ? "is-dropped" : ""} ${
                index === chosen ? "is-chosen" : ""
              }`}
              data-testid={TEST_IDS.pagesPickerPart}
              data-part-index={index}
              onClick={() => setChosen(index)}
            >
              {part.text}
            </button>
          </React.Fragment>
        ))}
      </div>
      <p className="pages-picker__summary" aria-live="polite">
        {pagesSummary(parts, chosen)}
      </p>
      <div className="pages-picker__actions">
        <button type="button" className="dm-btn dm-btn--sm dm-btn--ghost" data-testid={TEST_IDS.pagesPickerCancel} onClick={onDone}>
          Cancel
        </button>
        <button
          type="button"
          className="dm-btn dm-btn--sm"
          data-testid={TEST_IDS.pagesPickerSave}
          disabled={parts[chosen]!.key === record.pageUrl}
          onClick={save}
        >
          Save
        </button>
      </div>
    </div>
  );
};

// --- Color --------------------------------------------------------------------

/** Class names and inline style that paint a note in its color */
export const noteColorProps = (resolved: ResolvedNoteColor) =>
  resolved.kind === "palette"
    ? { className: resolved.name === "yellow" ? "" : `dm-note--${resolved.name}`, style: undefined }
    : {
        className: "note--legacy",
        style: { "--band": resolved.band, "--band-text": resolved.bandText } as React.CSSProperties,
      };

/** A note's original color from before 5.1, if it has (or had) one */
const originalColorOf = (note: Note): string | null => {
  const resolved = resolveNoteColor(note.color);
  if (resolved.kind === "legacy") return resolved.band;
  return (note.color as { original?: string })?.original || null;
};

export const ColorPicker = ({ note, onPick }: { note: Note; onPick: (color: string) => void }) => {
  const resolved = resolveNoteColor(note.color);
  const original = originalColorOf(note);
  return (
    <div className="swatches" role="radiogroup" aria-label="Note color">
      {NOTE_COLOR_NAMES.map((name) => {
        const checked = resolved.kind === "palette" && resolved.name === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={COLOR_LABELS[name]}
            title={COLOR_LABELS[name]}
            className="swatch"
            style={{ background: NOTE_PAPER[name] }}
            data-testid={TEST_IDS.noteColor}
            data-color={NOTE_PAPER[name]}
            onClick={() => onPick(name)}
          />
        );
      })}
      {original && (
        <button
          type="button"
          role="radio"
          aria-checked={resolved.kind === "legacy"}
          aria-label="Original color"
          title="Original color"
          className="swatch swatch--original"
          style={{ background: original }}
          data-testid={TEST_IDS.noteColor}
          data-color={original}
          onClick={() => onPick(original)}
        />
      )}
    </div>
  );
};

// --- Title and body -------------------------------------------------------------

export const TitleField = ({
  note,
  actions,
  className = "",
  autoFocus = false,
}: {
  note: Note;
  actions: NoteActions;
  className?: string;
  autoFocus?: boolean;
}) => {
  // Kept locally while editing so a delayed update from the store can't
  // overwrite what's being typed (see useStoreSyncedText)
  const title = useStoreSyncedText(note.title);
  // Spell check only while typing: red underlines all over notes that are
  // just being read (in another language, say) are noise
  const [focused, setFocused] = useState(false);
  return (
    <input
      className={`note-title ${className}`}
      data-testid={TEST_IDS.noteTitle}
      value={title.text}
      placeholder="Title"
      aria-label="Note title"
      autoFocus={autoFocus}
      maxLength={300}
      onChange={(event) => {
        title.onEdit(event.target.value);
        actions.setTitle(event.target.value);
      }}
      spellCheck={focused}
      onFocus={() => {
        title.onFocus();
        setFocused(true);
      }}
      onBlur={() => {
        title.onBlur();
        setFocused(false);
      }}
    />
  );
};

// The body is stored as HTML and rendered with innerHTML, inside the host web
// page for content scripts. Values coming from storage are sanitized so markup
// that ended up in a note (pasted content, an imported file) can't run scripts
// or event handlers in that page. What the user types is already live in the
// editor, so it is kept exactly as is; re-sanitizing it on every keystroke
// could change the markup and make the editor reset the caret.
const sanitize = (html: string) => (html ? DOMPurify.sanitize(html) : "");

// No text and nothing else (images, lists): the placeholder shows
export const isEmpty = (html: string) => !plainText(html) && !/<(img|li|hr|input)[\s>/]/i.test(html || "");

export const BodyField = ({
  note,
  actions,
  className = "",
  placeholder = "Write something…",
  autoFocus = false,
}: {
  note: Note;
  actions: NoteActions;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) => {
  const body = useStoreSyncedText(note.body, sanitize);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, []);

  const change = (html: string) => {
    body.onEdit(html);
    actions.setBody(html);
  };

  // The editor's own props must not change while typing: any change makes
  // react-contenteditable re-render and rewrite its HTML, which puts the
  // cursor back at the start (typing "Hello" saved "elloH"). So "empty" is a
  // class on a wrapper, and spell check is set on the element directly.
  return (
    <div className={`note-body-field ${isEmpty(body.text) ? "is-empty" : ""}`}>
      <ContentEditable
        innerRef={ref as React.RefObject<HTMLElement>}
        html={body.text}
        className={`note-body ${className}`}
        data-testid={TEST_IDS.noteBody}
        data-placeholder={placeholder}
        aria-label="Note text"
        role="textbox"
        aria-multiline="true"
        spellCheck={false}
        onChange={(event) => change(event.target.value)}
        onFocus={(event) => {
          body.onFocus();
          // Spell check only while typing (see TitleField)
          (event.currentTarget as HTMLElement).spellcheck = true;
        }}
        onBlur={(event) => {
          // Passing onBlur replaces the editor's own "save on blur", so
          // do it here: catch any change that didn't fire an input event
          const element = event.currentTarget as HTMLElement;
          const html = element.innerHTML;
          if (html !== body.text) change(html);
          body.onBlur();
          element.spellcheck = false;
        }}
      />
    </div>
  );
};

// --- Tags -----------------------------------------------------------------------

export const tagClassName = (tag: Pick<Tag, "color">) => {
  const name = tagColorName(tag.color);
  return name ? `dm-tag${name === "yellow" ? "" : ` dm-tag--${name}`}` : "dm-tag";
};

/** Tags from before 5.1 keep their own color */
export const tagStyle = (tag: Pick<Tag, "color">): React.CSSProperties | undefined =>
  tagColorName(tag.color) || !tag.color ? undefined : { background: tag.color, color: contrastingText(tag.color) };

export const TagPill = ({
  tag,
  onRemove,
  testId,
  children,
}: {
  tag: Tag;
  onRemove?: () => void;
  testId?: string;
  children?: React.ReactNode;
}) => (
  <span className={tagClassName(tag)} style={tagStyle(tag)} data-testid={testId} data-tag-text={tag.text}>
    {tag.text}
    {children}
    {onRemove && (
      <button type="button" className="dm-tag__remove" aria-label={`Remove tag ${tag.text}`} onClick={onRemove}>
        <CloseIcon size={10} />
      </button>
    )}
  </span>
);

const EMPTY_TAGS: Tag[] = [];

/**
 * A note's tags. Nothing shows on a note without tags: "Add tag" in the
 * note's menu opens the field (`adding`), which closes again when it's left
 * empty, so notes stay plain unless someone uses tags.
 */
export const TagEditor = ({
  tags,
  actions,
  adding,
  onDoneAdding,
}: {
  tags: Tag[];
  actions: NoteActions;
  adding: boolean;
  onDoneAdding: () => void;
}) => {
  const allTags = useSelector((state: State) => state.tags) || EMPTY_TAGS;
  const [text, setText] = useState("");

  if (!adding && tags.length === 0) return null;

  const query = text.trim().toLowerCase();
  const onNote = new Set(tags.map((tag) => tag.id));
  const suggestions = adding
    ? allTags.filter((tag) => !onNote.has(tag.id) && (!query || tag.text.toLowerCase().includes(query))).slice(0, 5)
    : [];

  const add = (value: string) => {
    if (!value.trim()) return;
    actions.addTag(value.trim());
    setText("");
  };

  const finish = () => {
    setText("");
    onDoneAdding();
  };

  return (
    <div className="tag-editor">
      <div className="dm-note__tags">
        {tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} testId={TEST_IDS.noteTag} onRemove={() => actions.removeTag(tag.id)} />
        ))}
        {adding && (
          <input
            className="dm-tag dm-tag--add tag-input"
            value={text}
            placeholder="Tag name"
            aria-label="New tag"
            autoFocus
            size={Math.max(8, text.length + 1)}
            maxLength={40}
            onChange={(event) => setText(event.target.value)}
            onBlur={(event) => {
              // Clicking a suggestion moves focus into the list; let that click land
              if ((event.relatedTarget as HTMLElement | null)?.closest?.(".tag-suggestions")) return;
              add(text);
              finish();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                // Enter on an empty field is done; otherwise add it and stay for another
                if (text.trim()) add(text);
                else finish();
              } else if (event.key === "Escape") {
                event.stopPropagation();
                finish();
              } else if (event.key === "Backspace" && !text && tags.length > 0) {
                actions.removeTag(tags[tags.length - 1]!.id);
              }
            }}
          />
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="tag-suggestions" aria-label="Your tags">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={tagClassName(tag)}
              style={tagStyle(tag)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(tag.text)}
            >
              {tag.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- More menu ------------------------------------------------------------------

/**
 * Closes a popover on Escape or a click outside it.
 *
 * On web pages the notes are in a closed shadow root, and listeners outside
 * it can't see which element inside was clicked (event.composedPath() stops
 * at the host). So clicks are first checked by a listener on the shadow root
 * itself, which marks the ones inside; the document listener closes the
 * popover for everything else. Both listen while the event bubbles, which
 * reaches the shadow root before the document.
 */
/** Whether a press landed on its element's scrollbar rather than its content */
const onScrollbar = (event: PointerEvent) => {
  const el = event.target;
  if (!(el instanceof Element)) return false;
  const box = el.getBoundingClientRect();
  const right = box.left + el.clientLeft + el.clientWidth;
  const bottom = box.top + el.clientTop + el.clientHeight;
  return (el.scrollHeight > el.clientHeight && event.clientX >= right) || (el.scrollWidth > el.clientWidth && event.clientY >= bottom);
};

/** The part of the screen a menu inside `el` can be seen in: its scrolling container, within the window */
const visibleArea = (el: HTMLElement) => {
  let top = 0;
  let bottom = window.innerHeight;
  for (let parent = el.parentElement; parent; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && parent.scrollHeight > parent.clientHeight) {
      const box = parent.getBoundingClientRect();
      top = Math.max(top, box.top);
      bottom = Math.min(bottom, box.bottom);
      break;
    }
  }
  return { top, bottom };
};

/**
 * Opens a menu where it fits: below its button, or above when there's no room
 * below (the last note in the popup's list). If it fits neither way, it's
 * scrolled into view, so nobody has to scroll to find the rest of it.
 */
const useMenuPlacement = (open: boolean, menu: React.RefObject<HTMLDivElement>) => {
  useLayoutEffect(() => {
    const el = menu.current;
    if (!open || !el) return;
    el.classList.remove("note-menu--up");
    const area = visibleArea(el);
    const below = el.getBoundingClientRect();
    if (below.bottom <= area.bottom) return;
    el.classList.add("note-menu--up");
    const above = el.getBoundingClientRect();
    if (above.top >= area.top) return;
    // Room neither way: below, scrolled into view
    el.classList.remove("note-menu--up");
    el.scrollIntoView({ block: "nearest" });
  }, [open]);
};

export const useDismiss = (open: boolean, close: () => void, ...refs: React.RefObject<HTMLElement>[]) => {
  useEffect(() => {
    if (!open) return;
    const root = (refs[0]?.current?.getRootNode() || document) as Document | ShadowRoot;
    const inside = new WeakSet<Event>();
    const markInside = (event: Event) => {
      const path = event.composedPath();
      if (refs.some((ref) => ref.current && path.includes(ref.current))) inside.add(event);
    };
    const onPointer = (event: Event) => {
      // Pressing a scrollbar (to see the rest of a menu, say) isn't a click
      // outside: the menu stays open
      if (!inside.has(event) && !onScrollbar(event as PointerEvent)) close();
    };
    const onKey = (event: Event) => {
      if ((event as KeyboardEvent).key === "Escape") close();
    };
    root.addEventListener("pointerdown", markInside);
    document.addEventListener("pointerdown", onPointer);
    // Capture: a note on a page stops keys at its edge (so they can't reach
    // the site), which would keep Escape from ever getting here on the way up
    root.addEventListener("keydown", onKey, true);
    if (root !== document) document.addEventListener("keydown", onKey, true);
    return () => {
      root.removeEventListener("pointerdown", markInside);
      document.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
};

/**
 * Color, show/hide on the page, open the page, delete. Always in the DOM
 * (hidden until opened) so its controls keep their test ids reachable.
 */
export const NoteMenu = React.forwardRef<
  HTMLDivElement,
  {
    open: boolean;
    record: NoteRecord;
    actions: NoteActions;
    inList?: boolean;
    onDone: () => void;
    onAddTag: () => void;
    /** Choose which pages it shows on (PagesPicker) */
    onShowOn?: () => void;
    /** In lists: go to the note on its page */
    onFind?: () => void;
    /** In lists of the page that's open: move the note to what's on screen there */
    onBringHere?: () => void;
    /** On the page itself: keep on screen, collapse */
    page?: { pinned: boolean; collapsed: boolean; onTogglePin: () => void; onToggleCollapsed: () => void };
  }
>(({ open, record, actions, inList = false, onDone, onAddTag, onShowOn, onFind, onBringHere, page }, ref) => {
  const { note, pageUrl } = record;
  const visible = note.visible !== false;
  const href = safeHref(note.created_on_url) || safeHref(patternBase(pageUrl));
  // Its own handle on the element too, to place it, besides the caller's
  const own = useRef<HTMLDivElement | null>(null);
  const setRef = (el: HTMLDivElement | null) => {
    own.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  useMenuPlacement(open, own);
  return (
    <div className="menu note-menu" role="menu" aria-label="Note options" hidden={!open} ref={setRef}>
      <div className="menu__label">Color</div>
      <ColorPicker
        note={note}
        onPick={(color) => {
          actions.setColor(color);
        }}
      />
      <div className="menu__sep" role="separator" />
      <button
        type="button"
        role="menuitem"
        className="menu__item"
        data-testid={TEST_IDS.noteAddTag}
        onClick={() => {
          onDone();
          onAddTag();
        }}
      >
        <TagIcon />
        Add tag
      </button>
      {onShowOn && canHaveNotes(patternBase(pageUrl)) && (
        <button
          type="button"
          role="menuitem"
          className="menu__item"
          data-testid={TEST_IDS.noteShowOn}
          onClick={() => {
            onDone();
            onShowOn();
          }}
        >
          <PagesIcon />
          Show on other pages
        </button>
      )}
      {/* Not for notes kept for a page notes can't go on (an extension store) */}
      {canHaveNotes(pageUrl) && (
        <button
          type="button"
          role="menuitem"
          className="menu__item"
          data-testid={TEST_IDS.noteVisibility}
          onClick={() => {
            actions.setVisible(!visible, { undoable: !inList });
            onDone();
          }}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
          {visible ? "Hide from page" : "Show on page"}
        </button>
      )}
      {page && (
        <>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={() => {
              onDone();
              page.onToggleCollapsed();
            }}
          >
            {page.collapsed ? <ExpandIcon /> : <CollapseIcon />}
            {page.collapsed ? "Expand" : "Collapse"}
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={() => {
              onDone();
              page.onTogglePin();
            }}
          >
            <PinIcon />
            {page.pinned ? "Scroll with the page" : "Keep on screen"}
          </button>
        </>
      )}
      {inList && visible && onBringHere && (
        <button
          type="button"
          role="menuitem"
          className="menu__item"
          data-testid={TEST_IDS.noteBringHere}
          onClick={() => {
            onDone();
            onBringHere();
          }}
        >
          <BringHereIcon />
          Bring here
        </button>
      )}
      {inList && visible && onFind && (
        <button
          type="button"
          role="menuitem"
          className="menu__item"
          data-testid={TEST_IDS.noteFind}
          onClick={() => {
            onDone();
            onFind();
          }}
        >
          <TargetIcon />
          Find on page
        </button>
      )}
      {inList && href && (
        <a role="menuitem" className="menu__item" href={href} data-testid={TEST_IDS.noteOpenPage} {...EXTERNAL_LINK_PROPS}>
          <ExternalIcon />
          Open page
        </a>
      )}
      <button
        type="button"
        role="menuitem"
        className="menu__item menu__item--danger"
        data-testid={TEST_IDS.noteDelete}
        onClick={() => {
          onDone();
          actions.remove();
        }}
      >
        <TrashIcon />
        Delete note
      </button>
    </div>
  );
});
