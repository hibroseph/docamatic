import React from 'react'
import { faHeart as fasHeart } from "@fortawesome/free-regular-svg-icons";
import ColorSwatch from "../ColorSwatch";
import {
    faArrowsAlt,
    faHeart,
    faEye,
    faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SettingsContainer, SettingsIconContainer } from "./style";

export const SettingsBar = props => {
    return (
        <SettingsContainer>
            <SettingsIconContainer color={{ ...props.color }}>
                <FontAwesomeIcon
                    className="icons"
                    onClick={props.onHeartifyClick}
                    icon={props.heart ? faHeart : fasHeart}
                ></FontAwesomeIcon>
                <FontAwesomeIcon
                    onClick={props.onDeleteClick}
                    className="icons"
                    icon={faTrashAlt}
                />
                <FontAwesomeIcon
                    onClick={props.onHideNote}
                    className="icons"
                    icon={faEye} />
                <FontAwesomeIcon
                    className="drag-handle icons"
                    style={{ color: props.stickify ? "grey" : props.color.text }}
                    icon={faArrowsAlt}
                />
            </SettingsIconContainer>
            <ColorSwatch
                colors={props.colors}
                onColorChange={color => props.onColorChange(color)}
            ></ColorSwatch>
        </SettingsContainer>
    )
}