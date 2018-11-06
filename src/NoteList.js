import React from 'react'
import PropTypes from 'prop-types'
import Note from "./Note"
import styled from "styled-components";
import { addNote, removeNote } from './actions'
import { connect } from 'react-redux'

const NoteList = ({ notes, onDeleteClick }) => {

    // console.log("IS THIS GETTING CALLED?")

    return (
        <Container>
            {notes.map(note => {
                return (
                    <Note key={note.id} {...note} onClick={() => onDeleteClick(note.id)} />
                )
            })}
        </Container>
    )
}

// Let's stop some bugs from happening
NoteList.propTypes = {
    notes: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            body: PropTypes.string.isRequired,
            color: PropTypes.string.isRequired,
            position: PropTypes.object.isRequired
            }).isRequired
    ).isRequired,
    onDeleteClick: PropTypes.func.isRequired
}

const Container = styled.div``;

const mapStateToProps = state => {
    // console.log("WHAT ABOUT THIS")

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
    }

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(NoteList)