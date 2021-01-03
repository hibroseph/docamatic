import React from 'react';
import { SettingsToggle, TitleBar as Container } from "./style"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
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
            />
            <SettingsToggle>
                <FontAwesomeIcon id={"settings-container-toggle"} className="icons" icon={faArrowLeft} /></SettingsToggle>
            <SettingsBar {...props}></SettingsBar>
        </Container>
    )
}