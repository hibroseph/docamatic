import React from 'react';
import { SettingsToggle, TitleBar as Container } from "./style"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEllipsisV
} from "@fortawesome/free-solid-svg-icons";

import {
} from "@fortawesome/free-regular-svg-icons";
import { useStoreSyncedText } from "../../utils/useStoreSyncedText";
import { SettingsBar } from "./SettingsBar";
import { TEST_IDS } from "../../utils/testIds";


export const TitleBar = props => {
    // Kept locally while editing so a delayed update from the store can't
    // overwrite what's being typed (see useStoreSyncedText). This also keeps
    // the caret where it is, which used to need manual cursor tracking.
    const title = useStoreSyncedText(props.title);

    const titleChange = event => {
        title.onEdit(event.target.value);
        props.onTitleChange(event);
    }

    return (
        <Container key={props.id} color={{ ...props.color }}>
            <input
            key={props.id}
                data-testid={TEST_IDS.noteTitle}
                style={{ margin: 0 }}
                value={title.text}
                placeholder="Title"
                onChange={titleChange}
                // Spell check only while typing: red underlines all over notes
                // that are just being read are noise
                spellCheck={false}
                onFocus={event => {
                    event.currentTarget.spellcheck = true;
                    title.onFocus(event);
                }}
                onBlur={event => {
                    event.currentTarget.spellcheck = false;
                    title.onBlur(event);
                }}
                // Keys typed here are the note's, not the page's: without this,
                // sites' keyboard shortcuts (a letter, the space bar) go off
                onKeyDown={event => event.stopPropagation()}
                onKeyUp={event => event.stopPropagation()}
                onKeyPress={event => event.stopPropagation()}
                onBeforeInput={event => {
                    event.stopPropagation()
                }}
                onMouseDown={event => event.stopPropagation()}
                onMouseUp={event => event.stopPropagation()}
            />
            <SettingsToggle>
                <FontAwesomeIcon id={"settings-container-toggle"} icon={faEllipsisV} color={props.color.text} /></SettingsToggle>
            <SettingsBar {...props}></SettingsBar>
        </Container>
    )
}