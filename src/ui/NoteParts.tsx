// The parts every note is built from, on a page or in a list: title, body,
// tags, colors and the More menu. StickyNote (on pages) and NoteCard (in the
// popup and side panel) arrange them differently, but they're the same
// controls with the same behavior.
import React, { useEffect, useRef, useState } from "react";
import ContentEditable from "react-contenteditable";
import DOMPurify from "dompurify";
import { useSelector } from "react-redux";
import { useStoreSyncedText } from "../utils/useStoreSyncedText";
import { TEST_IDS } from "../utils/testIds";
import { safeHref, EXTERNAL_LINK_PROPS } from "../utils/SafeLink";
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
import type { NoteActions } from "./useNoteActions";
import { CloseIcon, ExternalIcon, EyeIcon, EyeOffIcon, TagIcon, TargetIcon, TrashIcon } from "./icons";

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
      onFocus={title.onFocus}
      onBlur={title.onBlur}
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

  return (
    <ContentEditable
      innerRef={ref as React.RefObject<HTMLElement>}
      html={body.text}
      className={`note-body ${className}`}
      data-testid={TEST_IDS.noteBody}
      data-placeholder={placeholder}
      aria-label="Note text"
      role="textbox"
      aria-multiline="true"
      onChange={(event) => change(event.target.value)}
      onFocus={body.onFocus}
      onBlur={(event) => {
        // Passing onBlur replaces the editor's own "save on blur", so
        // do it here: catch any change that didn't fire an input event
        const html = (event.currentTarget as HTMLElement).innerHTML;
        if (html !== body.text) change(html);
        body.onBlur();
      }}
    />
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
      if (!inside.has(event)) close();
    };
    const onKey = (event: Event) => {
      if ((event as KeyboardEvent).key === "Escape") close();
    };
    root.addEventListener("pointerdown", markInside);
    document.addEventListener("pointerdown", onPointer);
    root.addEventListener("keydown", onKey);
    if (root !== document) document.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("pointerdown", markInside);
      document.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onKey);
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
    /** In lists: go to the note on its page */
    onFind?: () => void;
  }
>(({ open, record, actions, inList = false, onDone, onAddTag, onFind }, ref) => {
  const { note, pageUrl } = record;
  const visible = note.visible !== false;
  const href = safeHref(note.created_on_url || pageUrl) || safeHref(pageUrl);
  return (
    <div className="menu note-menu" role="menu" aria-label="Note options" hidden={!open} ref={ref}>
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
