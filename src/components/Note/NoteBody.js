import React from 'react'
import { StyledContentEditable } from './style'

export const NoteBody = props => {
    const bodyChange = event => {
        props.onBodyChange(event);
        //controls.body.setCursorPosition(event.target.selectionStart)
    }

    return <StyledContentEditable
        id="body"
        html={props.body}
        onChange={bodyChange}>
    </StyledContentEditable>
}