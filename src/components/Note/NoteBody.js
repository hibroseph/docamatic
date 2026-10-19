import React from 'react'
import DOMPurify from 'dompurify'
import { StyledContentEditable } from './style'

export const NoteBody = props => {
    const bodyChange = event => {
        props.onBodyChange(event);
        //controls.body.setCursorPosition(event.target.selectionStart)
    }

    // The body is stored as HTML and rendered with innerHTML, inside the host
    // web page for content scripts. Sanitize it so markup that ended up in a
    // note (pasted content, an imported file) can't run scripts or event
    // handlers in that page.
    const html = props?.body ? DOMPurify.sanitize(props.body) : "";

    return <StyledContentEditable
        html={html}
        onChange={bodyChange}
        onKeyDown={event => event.stopPropagation()}
        onKeyUp={event => event.stopPropagation()}
        onBeforeInput={event => event.stopPropagation()}>
    </StyledContentEditable>
}
