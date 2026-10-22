import React from 'react'
import DOMPurify from 'dompurify'
import { StyledContentEditable } from './style'
import { TEST_IDS } from '../../utils/testIds'
import { useStoreSyncedText } from '../../utils/useStoreSyncedText'

// The body is stored as HTML and rendered with innerHTML, inside the host web
// page for content scripts. Values coming from storage are sanitized so markup
// that ended up in a note (pasted content, an imported file) can't run scripts
// or event handlers in that page. What the user types is already live in the
// editor, so it is kept exactly as is; re-sanitizing it on every keystroke
// could change the markup and make the editor reset the caret.
const sanitize = (html) => (html ? DOMPurify.sanitize(html) : "");

export const NoteBody = props => {
    const body = useStoreSyncedText(props.body, sanitize);

    const bodyChange = event => {
        body.onEdit(event.target.value);
        props.onBodyChange(event);
    }

    return <StyledContentEditable
        html={body.text}
        data-testid={TEST_IDS.noteBody}
        onChange={bodyChange}
        // Spell check only while typing (set on the element: the editor
        // doesn't re-render for a prop change like this)
        spellCheck={false}
        onFocus={event => {
            event.currentTarget.spellcheck = true;
            body.onFocus(event);
        }}
        onBlur={event => {
            event.currentTarget.spellcheck = false;
            // Passing onBlur replaces the editor's own "save on blur", so
            // do it here: catch any change that didn't fire an input event
            const html = event.currentTarget.innerHTML;
            if (html !== body.text) bodyChange({ target: { value: html } });
            body.onBlur();
        }}
        onKeyDown={event => event.stopPropagation()}
        onKeyUp={event => event.stopPropagation()}
        onKeyPress={event => event.stopPropagation()}
        onBeforeInput={event => event.stopPropagation()}>
    </StyledContentEditable>
}
