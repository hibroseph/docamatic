// A note in a list (popup and side panel). The same parts as the note on the
// page (ui/NoteParts.tsx), editable in place, laid out for a list: no drag
// handle, and where the note is and when it was written underneath.
import React, { useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { TEST_IDS } from "../utils/testIds";
import { safeHref, EXTERNAL_LINK_PROPS } from "../utils/SafeLink";
import { resolveNoteColor } from "../model/colors";
import { pageLabel, tagsOfNote, domainOf } from "../model/notes";
import { friendlyDate } from "../model/dates";
import type { NoteRecord, State, Tag } from "../model/types";
import { useNoteActions } from "../ui/useNoteActions";
import { BodyField, NoteMenu, TagEditor, TitleField, noteColorProps, useDismiss } from "../ui/NoteParts";
import { EyeOffIcon, HeartIcon, MoreIcon } from "../ui/icons";

const NO_TAGS: Tag[] = [];

export const NoteCard = ({
  record,
  showPage = true,
  autoFocus = false,
}: {
  record: NoteRecord;
  /** Show which page the note is on (not needed in "This page") */
  showPage?: boolean;
  autoFocus?: boolean;
}) => {
  const { note, pageUrl } = record;
  const actions = useNoteActions(record);
  const allTags = useSelector((state: State) => state.tags) || NO_TAGS;
  const label = useSelector((state: State) => pageLabel(state, pageUrl));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const bodyWrap = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  useDismiss(menuOpen, () => setMenuOpen(false), menuRef, moreRef);

  // Long notes are shortened until clicked into; the fade says there's more
  useLayoutEffect(() => {
    const el = bodyWrap.current;
    if (el) setLong(el.scrollHeight > el.clientHeight + 2);
  }, [note.body]);

  const color = noteColorProps(resolveNoteColor(note.color));
  const href = safeHref(note.created_on_url || pageUrl) || safeHref(pageUrl);
  const hidden = note.visible === false;

  return (
    <article
      className={`dm-note note note--card ${color.className} ${menuOpen ? "has-menu" : ""}`}
      style={color.style}
      data-testid={TEST_IDS.note}
      data-note-id={note.id}
      aria-label={note.title ? `Note: ${note.title}` : "Note"}
    >
      <div className="dm-note__head note__head">
        <TitleField note={note} actions={actions} className="dm-note__title" autoFocus={autoFocus} />
        <div className="dm-note__actions">
          <button
            type="button"
            className="dm-note__action"
            aria-label={note.heart ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={Boolean(note.heart)}
            data-testid={TEST_IDS.noteFavorite}
            onClick={actions.toggleFavorite}
          >
            <HeartIcon filled={note.heart} />
          </button>
          <button
            type="button"
            ref={moreRef}
            className="dm-note__action"
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreIcon />
          </button>
        </div>
      </div>
      <div className={`note-card__body ${long ? "is-long" : ""}`} ref={bodyWrap}>
        <BodyField note={note} actions={actions} className="dm-note__body" />
      </div>
      <TagEditor note={note} tags={tagsOfNote(allTags, note)} actions={actions} />
      <div className="dm-note__meta note-card__meta">
        {showPage && href && (
          <a className="note-card__page" href={href} title={label} {...EXTERNAL_LINK_PROPS}>
            {domainOf(pageUrl) === label ? label : `${label} · ${domainOf(pageUrl)}`}
          </a>
        )}
        <span className="note-card__date">{friendlyDate(note.date_created)}</span>
        {hidden && (
          <span className="note-card__hidden" title="This note isn't shown on the page">
            <EyeOffIcon size={12} /> Not on page
          </span>
        )}
      </div>
      <NoteMenu ref={menuRef} open={menuOpen} record={record} actions={actions} inList onDone={() => setMenuOpen(false)} />
    </article>
  );
};
