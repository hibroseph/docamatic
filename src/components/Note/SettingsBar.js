import React from "react";
import { faHeart as fasHeart } from "@fortawesome/free-regular-svg-icons";
import ColorSwatch from "../ColorSwatch/ColorSwatch";
import { faArrowsAlt, faHeart, faEye, faEyeSlash, faTrashAlt, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SettingsContainer, SettingsIconContainer } from "./style";
import { COLORS } from "../../utils/constants";

export const SettingsBar = (props) => {
  return (
    <SettingsContainer color={{ ...props.color }}>
      <SettingsIconContainer color={{ ...props.color }}>
        <FontAwesomeIcon className="icons" onClick={props.onHeartifyClick} icon={props.heart ? faHeart : fasHeart}></FontAwesomeIcon>
        <FontAwesomeIcon onClick={props.onDeleteClick} className="icons" icon={faTrashAlt} />
        <FontAwesomeIcon onClick={() => props.onToggleVisibility(!props.visible)} className="icons" icon={props.visible ? faEye : faEyeSlash} />
        {props.popup ? (
          <a href={props.url} target="_new">
            <FontAwesomeIcon className="icons" icon={faExternalLinkAlt} />
          </a>
        ) : (
          <FontAwesomeIcon className="drag-handle icons" style={{ color: props.stickify ? "grey" : props.color.text }} icon={faArrowsAlt} />
        )}
      </SettingsIconContainer>
      <ColorSwatch colors={COLORS} onColorChange={(color) => props.onColorChange(color)}></ColorSwatch>
    </SettingsContainer>
  );
};
