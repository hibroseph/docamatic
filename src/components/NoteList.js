import React from "react";
import PropTypes from "prop-types";
import Note from "./Note";
import styled from "styled-components";
import { connect } from "react-redux";

import interact from "interactjs";
import NoteContainer from "../elements/NoteContainer";

import {
  addNote,
  removeNote,
  addText,
  addTitle,
  updateNotePosition,
  changeNoteColor,
  updateNoteSize
} from "../redux/actions";

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
    <Container>
      {notes.map(note => {
        return (
          <Note
            key={note.id}
            {...note}
            onDeleteClick={() => {
              console.log("The delete button was pressed");
              onDeleteClick(note.id);
            }}
            onBodyChange={event => {
              // console.log("Body change to: " + event.target.value)
              onTextChange(note.id, event.target.value, note.title);
            }}
            onTitleChange={event => {
              // console.log("Title changed to: " + event.target.value)
              onTitleChange(note.id, event.target.value);
            }}
            onPositionChange={(id, x, y) => {
              console.log("Position changed to: " + x + " ," + y);
              onPositionChange(id, x, y);
            }}
            // onNoteClicked={(id,) => {
            //   // console.log("You clicked note: " + id)
            //   onNoteClicked(id, )
            // }}

            onColorChange={() => {
              onColorChange(note.id);
            }}
            onSizeChange={(id, x, y) => {
              onSizeChange(id, x, y);
            }}
          />
        );
      })}
    </Container>
  );
};

// Let's stop some bugs from happening
NoteList.propTypes = {
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      body: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      position: PropTypes.object.isRequired
    }).isRequired
  ).isRequired,
  onDeleteClick: PropTypes.func.isRequired
};

const Container = styled.div``;

const mapStateToProps = state => {
  if (state[window.location.href] == null) {
    console.log("NoteList.js. page == null");
    return {
      notes: []
    };
  } else {
    console.log("NoteList.js. page != null");
    return {
      notes: state[window.location.href].notes
    };
  }

  // return {
  //   notes: state.window.location.href.notes
  // };
};

const mapDispatchToProps = dispatch => ({
  onSizeChange: (id, x, y) => {
    dispatch(updateNoteSize(id, x, y));
  },

  onAddClick: text => {
    dispatch(addNote(text));
  },

  onDeleteClick: id => {
    dispatch(removeNote(id));
  },

  onTextChange: (id, text, title) => {
    dispatch(addText(id, text, title));
  },

  onTitleChange: (id, text) => {
    dispatch(addTitle(id, text));
  },

  onPositionChange: (id, x, y) => {
    dispatch(updateNotePosition(id, x, y));
  },

  onColorChange: id => {
    console.log("Changing the color of note: " + id);
    dispatch(changeNoteColor(id));
  },

  onNoteClicked: id => {
    dispatch(updateNotePosition(id));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NoteList);
