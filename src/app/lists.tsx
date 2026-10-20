// Lists of notes and the empty states shown when there are none.
import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { NoteRecord, State } from "../model/types";
import { domainOf, groupByPage, pageLabel } from "../model/notes";
import { safeHref, EXTERNAL_LINK_PROPS } from "../utils/SafeLink";
import { NoRenderErrorBoundary } from "../ui/NoRenderErrorBoundary";
import { NoteCard } from "./NoteCard";

// Rendering every note at once gets slow for people with hundreds of them
const PAGE_SIZE = 30;

export const NoteList = ({
  records,
  showPage = true,
  focusNoteId,
}: {
  records: NoteRecord[];
  showPage?: boolean;
  focusNoteId?: string | null;
}) => {
  const [shown, setShown] = useState(PAGE_SIZE);
  return (
    <>
      <ul className="note-list">
        {records.slice(0, shown).map((record) => (
          <li key={record.note.id}>
            <NoRenderErrorBoundary>
              <NoteCard record={record} showPage={showPage} autoFocus={record.note.id === focusNoteId} />
            </NoRenderErrorBoundary>
          </li>
        ))}
      </ul>
      {records.length > shown && (
        <button type="button" className="dm-btn dm-btn--ghost show-more" onClick={() => setShown(shown + PAGE_SIZE)}>
          Show {Math.min(PAGE_SIZE, records.length - shown)} more
        </button>
      )}
    </>
  );
};

/** Notes under a heading for each page they're on */
export const GroupedNoteList = ({ records }: { records: NoteRecord[] }) => {
  const groups = groupByPage(records);
  const [shown, setShown] = useState(12);
  return (
    <>
      {groups.slice(0, shown).map((group) => (
        <section className="page-group" key={group.pageUrl} aria-label={group.pageUrl}>
          <PageRow pageUrl={group.pageUrl} count={group.records.length} />
          <NoteList records={group.records} showPage={false} />
        </section>
      ))}
      {groups.length > shown && (
        <button type="button" className="dm-btn dm-btn--ghost show-more" onClick={() => setShown(shown + 12)}>
          Show more pages
        </button>
      )}
    </>
  );
};

/** One page in a list: initial, title, domain, how many notes */
export const PageRow = ({ pageUrl, count }: { pageUrl: string; count: number }) => {
  const label = useSelector((state: State) => pageLabel(state, pageUrl));
  const domain = domainOf(pageUrl);
  const href = safeHref(pageUrl);
  const content = (
    <>
      <span className="dm-row__icon" aria-hidden="true">
        {domain.charAt(0).toUpperCase()}
      </span>
      <span className="dm-row__text">
        <span className="dm-row__title">{label}</span>
        <span className="dm-row__meta">{domain}</span>
      </span>
      <span className="dm-row__count" aria-label={`${count} note${count === 1 ? "" : "s"}`}>
        {count}
      </span>
    </>
  );
  return href ? (
    <a className="dm-row page-row" href={href} title={`Open ${label}`} {...EXTERNAL_LINK_PROPS}>
      {content}
    </a>
  ) : (
    <div className="dm-row page-row">{content}</div>
  );
};

/** One title (with the signature swipe on a word), one sentence, maybe one action */
export const EmptyState = ({
  before,
  swipe,
  after = "",
  text,
  children,
}: {
  before: string;
  swipe?: string;
  after?: string;
  text: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div className="dm-empty empty">
    <h2 className="dm-empty__title">
      {before}
      {swipe && (
        <>
          {" "}
          <span className="dm-swipe">{swipe}</span>
        </>
      )}
      {after}
    </h2>
    <p className="dm-empty__text">{text}</p>
    {children}
  </div>
);
