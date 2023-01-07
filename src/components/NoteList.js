//@ts-ignore
import React, { useState, useEffect } from "react";
import { DraggableNote } from "./Note/DraggableNote";
import { connect } from "react-redux";
import {
  updateNotePosition,
  updateNoteSize
} from "../redux/actions";
import { GetSafeNoteUrl } from "../utils/GetSafeNoteUrl"
import { NoRenderErrorBoundary } from "./NoRenderErrorBoundary";

export const NoteList = (props) => {

  const [noteOnTop, setNoteOnTop] = useState(0);

  useEffect(() => { console.log("disconnected changed in notelist " + props.disconnected)}, [props.disconnected])
    return (
      <div>
        {props.url && props.notes.map(note => {
          if (note.visible || note.visible == undefined) {
            return (
              <NoRenderErrorBoundary key={note.id}>
                <DraggableNote
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
                  tags={props.tags.filter(tag => tag.notes.includes(note.id))}
                  scrollYOffset={props.scrollYOffset}
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

const mapStateToProps = (state, props) => {
  //@ts-ignore
  let safeUrl = GetSafeNoteUrl(window.location.href);
  if (state.pages[safeUrl] == null) {
    return {
      notes: [],
      tags: []
    };
  } else {
    return {
      notes: state.pages[safeUrl].notes,
      tags: state["tags"] || [],
      scrollYOffset: props.scrollYOffset
    };
  }
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
        console.error(props);
    }

    return dispatch(action)
      .catch(e => {
        // catch all errors and hopefully handle with retry
        // TODO: Create retry loop to only retry a few times and then error out
        // TODO: Get types for chrome
        // @ts-ignore
        chrome.runtime.connect({ name: "SCRIPT" });
        // @ts-ignore
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.type === "STORE_INITIALIZED") {
            // Initializes the popup logic
            mapDispatchToProps(dispatch).mutateNote(props);
          }
        });
      })

    /*
      onSizeChange: (id, x, url) => dispatch(updateNoteSize(id, x, url)),
    onPositionChange: (id, x, y, url) => dispatch(updateNotePosition(id, x, y, url))*/
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(NoteList);
