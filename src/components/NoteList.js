//@ts-ignore
import React, { useEffect, useState } from "react";
import { DraggableNote } from "./Note/DraggableNote";
import { connect } from "react-redux";
import {
  updateNotePosition,
  updateNoteSize
} from "../redux/actions";
import { NoRenderErrorBoundary } from "./NoRenderErrorBoundary";
import { noteUrlsFor } from "../utils/noteUrl";
import { notesOnPage } from "../redux/pageNotes";
import { NEW_NOTE_WINDOW_MS } from "../redux/noteShown";
import { CHROME_MESSAGES } from "../utils/constants";

const NO_NOTES = [];

// Notes already reported as shown on this page
const reportedShown = new Set();

// Tells the background when a note that was just created becomes visible:
// the last step of the note-creation funnel (see redux/noteShown.js). Only
// recently created notes are reported; others are just a page being revisited.
// The homepage demo renders this same list on a normal website, where there's
// no extension to tell, so it does nothing there.
export const reportNewlyShownNotes = (notes) => {
  if (!globalThis.chrome?.runtime?.id) return;
  const now = Date.now();
  notes.forEach(({ note }) => {
    if (reportedShown.has(note.id) || !(now - Number(note.date_created) <= NEW_NOTE_WINDOW_MS)) return;
    reportedShown.add(note.id);
    chrome.runtime.sendMessage({ type: CHROME_MESSAGES.NOTE_SHOWN, noteId: note.id }).catch(() => {});
  });
};

export const NoteList = (props) => {

  const [noteOnTop, setNoteOnTop] = useState(0);

  // After rendering, so "shown" means actually on the page
  useEffect(() => {
    if (props.url) reportNewlyShownNotes(props.notes);
  }, [props.notes, props.url]);

    return (
      <div>
        {props.url && props.notes.map(({ note, pageUrl }) => {
          if (note.visible || note.visible == undefined) {
            return (
              <NoRenderErrorBoundary key={note.id}>
                <DraggableNote
                  windowWidth={props.windowWidth}
                  onPositionChange={(id, x, y) =>
                    // @ts-ignore
                    props.mutateNote({ id, x, y, url: pageUrl, type: 'position_change' })
                  }
                  onSizeChange={(width) =>
                    // @ts-ignore
                    props.mutateNote({ id: note.id, width, url: pageUrl, type: 'size_change' })
                  }
                  key={note.id}
                  {...note}
                  tags={props.tags.filter(tag => tag.notes?.includes(note.id))}
                  // The url this note is saved under, which edits must use
                  url={pageUrl}
                  setZIndex={() => {
                    setNoteOnTop(note.id)}}
                  style={{ zIndex: noteOnTop && note.id == noteOnTop ? 1 : 0 }}
                  disconnected={props.disconnected}
                />
              </NoRenderErrorBoundary>
            )
          }
        })}
      </div>
    );

}

// Uses the url App is tracking (rather than reading location again). A page's
// notes can be saved under more than one url (see utils/noteUrl.js), so they
// are collected from each. The result is reused while those note arrays are
// unchanged, so updates to other pages' notes don't re-render this page.
const makeMapStateToProps = () => {
  let lastKey = null;
  let lastSources = [];
  let lastNotes = NO_NOTES;

  return (state, props) => {
    const keys = noteUrlsFor(props.url);
    const sources = keys.map((key) => state.pages?.[key]?.notes);
    const keyString = keys.join(" ");
    const unchanged = keyString === lastKey && sources.every((notes, i) => notes === lastSources[i]);

    if (!unchanged) {
      lastKey = keyString;
      lastSources = sources;
      const notes = notesOnPage(state, keys);
      lastNotes = notes.length > 0 ? notes : NO_NOTES;
    }

    return {
      notes: lastNotes,
      tags: state.tags || NO_NOTES,
    };
  };
};

const mapDispatchToProps = dispatch => ({
  mutateNote: (props) => {
    let action;

    switch (props.type) {
      case 'size_change':
        action = updateNoteSize(props.id, props.width, props.url);
        break;
      case 'position_change':
        action = updateNotePosition(props.id, props.x, props.y, props.url);
        break;
      default:
        console.error("mutateNote state " + props.type + "not handled")
        return;
    }

    return dispatch(action)
  }
});

export default connect(makeMapStateToProps, mapDispatchToProps)(NoteList);
