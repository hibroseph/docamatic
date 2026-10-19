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
                onFocus={title.onFocus}
                onBlur={title.onBlur}
                onKeyDown={event => event.stopPropagation()}
                onKeyUp={event => event.stopPropagation()}
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