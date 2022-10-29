import React from 'react';
import { SettingsToggle, TitleBar as Container } from "./style"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEllipsisV
} from "@fortawesome/free-solid-svg-icons";

import {
} from "@fortawesome/free-regular-svg-icons";
import { useInputControls } from "../../utils/useInputControls";
import { SettingsBar } from "./SettingsBar";

export const TitleBar = props => {
    const controls = useInputControls();

    const titleChange = event => {
        props.onTitleChange(event);
        controls.title.setCursorPosition(event.target.selectionStart);
    }

    return (
        <Container color={{ ...props.color }}>
            <input
                ref={controls.title.ref}
                style={{ margin: 0 }}
                value={props.title}
                onChange={titleChange}
                onKeyDown={event => event.stopPropagation()}
                onKeyUp={event => event.stopPropagation()}
                onBeforeInput={event => event.stopPropagation()}
            />
            <SettingsToggle>
                <FontAwesomeIcon id={"settings-container-toggle"} icon={faEllipsisV} color={props.color.text} /></SettingsToggle>
            <SettingsBar {...props}></SettingsBar>
        </Container>
    )
}