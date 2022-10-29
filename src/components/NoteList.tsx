import * as React from "react";
import { DraggableNote } from "./Note/DraggableNote";
import { connect } from "react-redux";
import * as Types from "../types";
import {
  updateNotePosition,
  updateNoteSize
} from "../redux/actions";
import { GetSafeNoteUrl } from "../utils/GetSafeNoteUrl"


class NoteList extends React.Component<Types.NoteListProps, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {this.props.url && this.props.notes.map(note => {
          if (note.visible || note.visible == undefined) {
            return (
              <DraggableNote
                onPositionChange={(id, x, y) =>
                  // @ts-ignore
                  this.props.mutateNote({ id, x, y, url: this.props.url, type: 'position_change' })
                }
                onSizeChange={(width) =>
                  // @ts-ignore
                  this.props.mutateNote({ id: note.id, width, url: this.props.url, type: 'size_change' })
                }
                key={note.id}
                {...note}
                tags={this.props.tags.filter(tag => tag.notes.includes(note.id))}
                scrollYOffset={this.props.scrollYOffset}
                url={this.props.url}
              />
            )
          }
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {

  let safeUrl: string = GetSafeNoteUrl(window.location.href);

  if (state[safeUrl] == null) {
    return {
      notes: [],
      tags: []
    };
  } else {
    return {
      notes: state[safeUrl].notes,
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
