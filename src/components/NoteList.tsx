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
                  this.props.onPositionChange(id, x, y, this.props.url)
                }
                onSizeChange={(width) =>
                  this.props.onSizeChange(note.id, width, this.props.url)
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
  onSizeChange: (id, x, url) => dispatch(updateNoteSize(id, x, url)),
  onPositionChange: (id, x, y, url) => dispatch(updateNotePosition(id, x, y, url)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NoteList);
