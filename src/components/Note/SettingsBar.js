import React from 'react'
import { faHeart as fasHeart } from "@fortawesome/free-regular-svg-icons";
import ColorSwatch from "../ColorSwatch/ColorSwatch";
import {
    faArrowsAlt,
    faHeart,
    faEye,
    faEyeSlash,
    faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SettingsContainer, SettingsIconContainer } from "./style";

export const SettingsBar = props => {
    console.log(props)
    return (
        <SettingsContainer color={{ ...props.color }}>
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
                    onClick={() => props.onToggleVisibility(!props.visible)}
                    className="icons"
                    icon={props.visible ? faEye : faEyeSlash} />
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