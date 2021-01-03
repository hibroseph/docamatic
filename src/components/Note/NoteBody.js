import React from 'react'
import ContentEditable from 'react-contenteditable'

export const NoteBody = props => {
    const bodyChange = event => {
        props.onBodyChange(event);
        //controls.body.setCursorPosition(event.target.selectionStart)
    }

    return <ContentEditable
        id="body"
        html={props.body}
        onChange={bodyChange}>
    </ContentEditable>
}