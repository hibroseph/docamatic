import React, { useRef } from "react";
import { MiniSearchNoteContainer } from "../elements/MiniSearchNoteContainer";
import {
  faTrashAlt,
  faExternalLinkAlt,
  faEyeSlash,
  faEye,
  faHeart,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons'
import { faHeart as fasHeart } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";
import { removeNote, addTitle, addText, toggleVisibility, heartify } from "../redux/actions";
import { useInputControls } from "../utils/useInputControls";
import ContentEditable from 'react-contenteditable'

const MiniSearchNote = props => {

  const controls = useInputControls();
  const bodyRef = useRef(null);

  const titleChange = event => {
    props.onNoteTitleChange(props.id, event.target.value, props.website);
    controls.title.setCursorPosition(event.target.selectionStart);
  }

  const bodyChange = event => {
    //controls.body.ref.current.style.height = calculateHeight(event.target.value);
    props.onNoteBodyChange(props.id, event.target.value, props.website)
    //controls.body.setCursorPosition(event.target.selectionStart);
  }

  const toggleVisibility = () => {
    props.onToggleVisibility(props.id, props.website, props.visible != undefined ? !props.visible : false);
  }

  const toggleHeart = () => {
    props.onToggleHeart(props.id, props.website);
  }

  const DetermineShowHideIcon = () => {

    return props.visible == undefined || props.visible ?
      <FontAwesomeIcon
        className="icon"
        icon={faEye}
        onClick={toggleVisibility}
      ></FontAwesomeIcon> :
      <FontAwesomeIcon
        className="icon"
        icon={faEyeSlash}
        onClick={toggleVisibility}
      ></FontAwesomeIcon>
  }

  const DetermineHeartIcon = () => {
    return <FontAwesomeIcon
      className="icon"
      icon={props.heart ? faHeart : fasHeart}
      onClick={toggleHeart}
    ></FontAwesomeIcon>
  }
  return (
    <MiniSearchNoteContainer
      color={props.color}
    >
      {props.showUrlPreview != null &&
        <p className="url-preview">{props.previewText}</p>
      }
      <div className="note">
        <div className="title-bar">
          <input
            id={"title"}
            ref={controls.title.ref}
            value={props.title}
            onChange={titleChange}></input>
          <div className="manageIcons">
            {DetermineHeartIcon()}
            {DetermineShowHideIcon()}
            <FontAwesomeIcon
              className="icon"
              icon={faExternalLinkAlt}
              onClick={() => {
                window.open(props.website, "_blank")
              }}
            ></FontAwesomeIcon>
            <FontAwesomeIcon
              className="icon"
              icon={faTrashAlt}
              onClick={(event) => {
                props.onDeleteClick(props.id, props.website)
                event.stopPropagation();
              }}
            />
          </div>
        </div>
        <ContentEditable
          id="body"
          innerRef={bodyRef}
          html={props.body}
          onChange={bodyChange}
        ></ContentEditable>
      </div>
    </MiniSearchNoteContainer>
  );
}


const mapDispatchToProps = dispatch => ({
  onDeleteClick: (id, url) => dispatch(removeNote(id, url)),
  onNoteBodyChange: (id, text, url) => dispatch(addText(id, text, url)),
  onNoteTitleChange: (id, text, url) => dispatch(addTitle(id, text, url)),
  onToggleVisibility: (id, url, visible) => dispatch(toggleVisibility(id, url, visible)),
  onToggleHeart: (id, url) => dispatch(heartify(id, url))
});

export default connect(null, mapDispatchToProps)(MiniSearchNote);
