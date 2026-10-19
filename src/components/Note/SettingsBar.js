import React from "react";
import { faHeart as fasHeart } from "@fortawesome/free-regular-svg-icons";
import ColorSwatch from "../ColorSwatch/ColorSwatch";
import { faArrowsAlt, faHeart, faEye, faEyeSlash, faTrashAlt, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SettingsContainer, SettingsIconContainer } from "./style";
import { COLORS } from "../../utils/constants";
import { safeHref, EXTERNAL_LINK_PROPS } from "../../utils/SafeLink";
import { TEST_IDS } from "../../utils/testIds";

export const SettingsBar = (props) => {
  return (
    <SettingsContainer color={{ ...props.color }}>
      <SettingsIconContainer color={{ ...props.color }}>
        <FontAwesomeIcon data-testid={TEST_IDS.noteFavorite} className="icons" onClick={props.onHeartifyClick} icon={props.heart ? faHeart : fasHeart}></FontAwesomeIcon>
        <FontAwesomeIcon data-testid={TEST_IDS.noteDelete} onClick={props.onDeleteClick} className="icons" icon={faTrashAlt} />
        <FontAwesomeIcon data-testid={TEST_IDS.noteVisibility} onClick={() => props.onToggleVisibility(!props.visible)} className="icons" icon={props.visible ? faEye : faEyeSlash} />
        {props.popup ? (
          <a data-testid={TEST_IDS.noteOpenPage} href={safeHref(props.url)} {...EXTERNAL_LINK_PROPS}>
            <FontAwesomeIcon className="icons" icon={faExternalLinkAlt} />
          </a>
        ) : (
          <FontAwesomeIcon data-testid={TEST_IDS.noteDragHandle} className="drag-handle icons" style={{ color: props.stickify ? "grey" : props.color.text }} icon={faArrowsAlt} />
        )}
      </SettingsIconContainer>
      <ColorSwatch colors={COLORS} onColorChange={(color) => props.onColorChange(color)}></ColorSwatch>
    </SettingsContainer>
  );
};
