import * as React from "react";
import Note from "./Note";
import { connect } from "react-redux";
import * as Types from "../types";
import { COLORS } from "../utils/constants";

import {
  addNote,
  removeNote,
  addText,
  addTitle,
  updateNotePosition,
  changeNoteColor,
  updateNoteSize,
  updateNoteDepth,
  stickify,
  heartify,
  toggleVisibility
} from "../redux/actions";

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
              <Note
                key={note.id}
                {...note}
                scrollYOffset={this.props.scrollYOffset}
                colors={COLORS}
                onHeartifyClick={() => this.props.onHeartify(note.id, this.props.url)}
                onStickifyClick={() => this.props.onStickify(note.id, this.props.url)}
                onDeleteClick={() => this.props.onDeleteClick(note.id, this.props.url)}
                onBodyChange={event =>
                  this.props.onTextChange(note.id, event.target.value, this.props.url)
                }
                onTitleChange={event =>
                  this.props.onTitleChange(note.id, event.target.value, this.props.url)
                }
                onPositionChange={(id, x, y) =>
                  this.props.onPositionChange(id, x, y, this.props.url)
                }
                onNoteClicked={id => this.props.onNoteClicked(id, this.props.url)}
                onColorChange={color => this.props.onColorChange(note.id, color, this.props.url)}
                onSizeChange={(width, height) =>
                  this.props.onSizeChange(note.id, width, height, this.props.url)
                }
                onHideNote={() => this.props.onHideNote(note.id, this.props.url)}
              />
            )
          };
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  if (state[window.location.href] == null) {
    return {
      notes: []
    };
  } else {
    return {
      notes: state[window.location.href].notes,
      scrollYOffset: props.scrollYOffset
    };
  }
};

const mapDispatchToProps = dispatch => ({
  onHeartify: (id, url) => dispatch(heartify(id, url)),
  onStickify: (id, url) => dispatch(stickify(id, url)),
  onSizeChange: (id, x, y, url) => dispatch(updateNoteSize(id, x, y, url)),
  onAddClick: (text, url) => dispatch(addNote(text, url)),
  onDeleteClick: (id, url) => dispatch(removeNote(id, url)),
  onTextChange: (id, text, url) => dispatch(addText(id, text, url)),
  onTitleChange: (id, text, url) => dispatch(addTitle(id, text, url)),
  onPositionChange: (id, x, y, url) => dispatch(updateNotePosition(id, x, y, url)),
  onColorChange: (id, color, url) => dispatch(changeNoteColor(id, url, color)),
  onNoteClicked: (id, url) => dispatch(updateNoteDepth(id, url)),
  onHideNote: (id, url) => dispatch(toggleVisibility(id, url, false))
});

export default connect(mapStateToProps, mapDispatchToProps)(NoteList);
