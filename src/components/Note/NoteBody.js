import React from 'react'
import { StyledContentEditable } from './style'

export const NoteBody = props => {
    const bodyChange = event => {
        props.onBodyChange(event);
        //controls.body.setCursorPosition(event.target.selectionStart)
    }

    var htmlBody = props?.body ? { html: props.body } : { html: ""};
    return <StyledContentEditable
        {...htmlBody}
        onChange={bodyChange}
        onKeyDown={event => event.stopPropagation()}
        onKeyUp={event => event.stopPropagation()}
        onBeforeInput={event => event.stopPropagation()}>
    </StyledContentEditable>
}