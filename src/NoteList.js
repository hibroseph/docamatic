import React from 'react'
import PropTypes from 'prop-types'
import Note from "./Note"
import styled from "styled-components";
import { addNote, removeNote, addText, addTitle } from './actions'
import { connect } from 'react-redux'

const NoteList = ({ notes, onDeleteClick, onTextChange, onTitleChange}) => {


    return (
        <Container>
            {notes.map(note => {
                return (
                    <Note key={note.id} {...note}
                        onClick={() => onDeleteClick(note.id)}
                        onNoteChange={(event) => {
                            // console.log("Body change to: " + event.target.value)
                            onTextChange(note.id, event.target.value, note.title)
                        }}
                        onTitleChange={(event) => {
                            // console.log("Title changed to: " + event.target.value)
                            onTitleChange(note.id, event.target.value)
                        }}
                        />                        
                )
            })}
        </Container>
    )
}

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
}

const Container = styled.div``;

const mapStateToProps = state => {
    return ({
        notes: state.notes

    });
};

const mapDispatchToProps = dispatch => ({
    onAddClick: text => {
        dispatch(addNote(text))
    },

    onDeleteClick: id => {
        dispatch(removeNote(id))
    },

    onTextChange: (id, text, title) => {
        console.log("title: " + title)
        dispatch(addText(id, text, title))
    },

    onTitleChange: (id, text) => {
        dispatch(addTitle(id, text))
    }
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(NoteList)