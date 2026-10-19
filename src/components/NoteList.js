//@ts-ignore
import React, { useState } from "react";
import { DraggableNote } from "./Note/DraggableNote";
import { connect } from "react-redux";
import {
  updateNotePosition,
  updateNoteSize
} from "../redux/actions";
import { NoRenderErrorBoundary } from "./NoRenderErrorBoundary";

const NO_NOTES = [];

export const NoteList = (props) => {

  const [noteOnTop, setNoteOnTop] = useState(0);

    return (
      <div>
        {props.url && props.notes.map(note => {
          if (note.visible || note.visible == undefined) {
            return (
              <NoRenderErrorBoundary key={note.id}>
                <DraggableNote
                  windowWidth={props.windowWidth}
                  onPositionChange={(id, x, y) =>
                    // @ts-ignore
                    props.mutateNote({ id, x, y, url: props.url, type: 'position_change' })
                  }
                  onSizeChange={(width) =>
                    // @ts-ignore
                    props.mutateNote({ id: note.id, width, url: props.url, type: 'size_change' })
                  }
                  key={note.id}
                  {...note}
                  tags={props.tags.filter(tag => tag.notes?.includes(note.id))}
                  url={props.url}
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

// Uses the url App is tracking (rather than reading location again) so the
// notes shown and the url used to save edits can never disagree
const mapStateToProps = (state, props) => {
  return {
    notes: state.pages?.[props.url]?.notes || NO_NOTES,
    tags: state.tags || NO_NOTES,
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

export default connect(mapStateToProps, mapDispatchToProps)(NoteList);
