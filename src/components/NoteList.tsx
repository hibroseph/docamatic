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
  heartify
} from "../redux/actions";

const PAGE = window.location.href;

class NoteList extends React.Component<Types.NoteListProps, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {this.props.notes.map(note => {
          return (
            <Note
              key={note.id}
              {...note}
              scrollYOffset={this.props.scrollYOffset}
              colors={COLORS}
              onHeartifyClick={() => this.props.onHeartify(note.id)}
              onStickifyClick={() => this.props.onStickify(note.id)}
              onDeleteClick={() => this.props.onDeleteClick(note.id)}
              onBodyChange={event =>
                this.props.onTextChange(note.id, event.target.value, note.title)
              }
              onTitleChange={event =>
                this.props.onTitleChange(note.id, event.target.value)
              }
              onPositionChange={(id, x, y) =>
                this.props.onPositionChange(id, x, y)
              }
              onNoteClicked={id => this.props.onNoteClicked(id)}
              onColorChange={color => this.props.onColorChange(note.id, color)}
              onSizeChange={(width, height) =>
                this.props.onSizeChange(note.id, width, height)
              }
            />
          );
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
  onHeartify: id => dispatch(heartify(id, PAGE)),
  onStickify: id => dispatch(stickify(id, PAGE)),
  onSizeChange: (id, x, y) => dispatch(updateNoteSize(id, x, y, PAGE)),
  onAddClick: text => dispatch(addNote(text, PAGE)),
  onDeleteClick: id => dispatch(removeNote(id, PAGE)),
  onTextChange: (id, text, title) => dispatch(addText(id, text, title, PAGE)),
  onTitleChange: (id, text) => dispatch(addTitle(id, text, PAGE)),
  onPositionChange: (id, x, y) => dispatch(updateNotePosition(id, x, y, PAGE)),
  onColorChange: (id, color) => dispatch(changeNoteColor(id, PAGE, color)),
  onNoteClicked: id => dispatch(updateNoteDepth(id, PAGE))
});

export default connect(mapStateToProps, mapDispatchToProps)(NoteList);
