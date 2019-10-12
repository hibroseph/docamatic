import React from "react";
import PropTypes from "prop-types";
import Note from "./Note";
import { connect } from "react-redux";

// Colors that are displayed in the color picker
import { COLORS } from "../utils/constants";

import {
  addNote,
  removeNote,
  addText,
  addTitle,
  updateNotePosition,
  changeNoteColor,
  updateNoteSize,
  updateNoteDepth
} from "../redux/actions";

const PAGE = window.location.href;

const NoteList = ({
  notes,
  onDeleteClick,
  onTextChange,
  onTitleChange,
  onPositionChange,
  onColorChange,
  onNoteClicked,
  onSizeChange
}) => {
  return (
    <div>
      {notes.map(note => {
        return (
          <Note
            key={note.id}
            {...note}
            colors={COLORS}
            onDeleteClick={() => {
              onDeleteClick(note.id);
            }}
            onBodyChange={event => {
              onTextChange(note.id, event.target.value, note.title);
            }}
            onTitleChange={event => {
              onTitleChange(note.id, event.target.value);
            }}
            onPositionChange={(id, x, y) => {
              onPositionChange(id, x, y);
            }}
            onNoteClicked={id => {
              onNoteClicked(id);
            }}
            onColorChange={color => {
              console.log("changing olor");
              onColorChange(note.id, color);
            }}
            onSizeChange={(x, y) => {
              onSizeChange(note.id, x, y);
            }}
          />
        );
      })}
    </div>
  );
};

// Let's stop some bugs from happening
// NoteList.propTypes = {
//   notes: PropTypes.arrayOf(
//     PropTypes.shape({
//       id: PropTypes.string.isRequired,
//       body: PropTypes.string.isRequired,
//       color: PropTypes.string.isRequired,
//       position: PropTypes.object.isRequired
//     }).isRequired
//   ).isRequired,
//   onDeleteClick: PropTypes.func.isRequired
// };

const mapStateToProps = state => {
  if (state[window.location.href] == null) {
    return {
      notes: []
    };
  } else {
    return {
      notes: state[window.location.href].notes
    };
  }
};

const mapDispatchToProps = dispatch => ({
  onSizeChange: (id, x, y) => {
    dispatch(updateNoteSize(id, x, y, PAGE));
  },

  onAddClick: text => {
    dispatch(addNote(text, PAGE));
  },

  onDeleteClick: id => {
    dispatch(removeNote(id, PAGE));
  },

  onTextChange: (id, text, title) => {
    dispatch(addText(id, text, title, PAGE));
  },

  onTitleChange: (id, text) => {
    dispatch(addTitle(id, text, PAGE));
  },

  onPositionChange: (id, x, y) => {
    dispatch(updateNotePosition(id, x, y, PAGE));
  },

  onColorChange: (id, color) => {
    dispatch(changeNoteColor(id, PAGE, color));
  },

  onNoteClicked: id => {
    dispatch(updateNoteDepth(id, PAGE));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NoteList);
