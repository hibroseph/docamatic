import React, { useEffect, useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { NoteContainer as Container } from "../styles/NoteStyles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsAlt,
  faHeart,
  faThumbtack,
  faTrashAlt
} from "@fortawesome/free-solid-svg-icons";

import { faHeart as fasHeart } from "@fortawesome/free-regular-svg-icons";
import ColorSwatch from "./ColorSwatch";

/*
  there currently is a glitch in the space time when you move a card. I think it has to do with the props
  not getting set fast enough so the note glitches back since we are setting the current position to be the y position
*/
const Note = props => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const textAreaRef = useRef(null);

  useEffect(() => {
    textAreaRef.current.selectionStart = cursorPosition;
    textAreaRef.current.selectionEnd = cursorPosition;
  })
  return (
    <Rnd
      default={{
        x: props.position.x,
        y: props.position.y,

        width: props.size.width,
        height: props.size.height
      }}
      onDragStop={(e, d) => {
        props.onPositionChange(props.id, d.x, d.y);
      }}
      onResizeStop={(e, d, ref, delta, position) => {
        props.onSizeChange(
          props.size.width + delta.width,
          props.size.height + delta.height
        );
      }}
      dragHandleClassName="drag-handle"
      minWidth={200}
      minHeight={200}
      bounds="window"
      enableResizing={{
        top: false,
        left: false,
        right: true,
        bottom: true,
        topRight: false,
        topLeft: false,
        bottomRight: true,
        bottomLeft: false
      }}
      disableDragging={props.stickify ? true : false}
      style={{ position: props.stickify ? "fixed" : "absolute" }}
    >
      <Container stickify={props.stickify} color={props.color}>
        <div className="title">
          <input
            style={{ margin: 0 }}
            value={props.title}
            onChange={props.onTitleChange}
          />
          <FontAwesomeIcon className="arrow icons" icon={faArrowLeft} />

          <div className="settings-container">
            <div className="icon-container">
              <FontAwesomeIcon
                className="icons"
                onClick={props.onHeartifyClick}
                icon={props.heart ? faHeart : fasHeart}
              ></FontAwesomeIcon>
              {/* <FontAwesomeIcon
                className="icons"
                icon={faThumbtack}
                onClick={props.onStickifyClick}
                style={{ color: props.stickify ? props.color.text : "grey" }}
              ></FontAwesomeIcon> */}
              <FontAwesomeIcon
                onClick={props.onDeleteClick}
                className="icons"
                icon={faTrashAlt}
              />
              <FontAwesomeIcon
                className="drag-handle icons"
                style={{ color: props.stickify ? "grey" : props.color.text }}
                icon={faArrowsAlt}
              />
            </div>
            <ColorSwatch
              colors={props.colors}
              onColorChange={color => props.onColorChange(color)}
            ></ColorSwatch>
          </div>
        </div>

        <div className="body">
          <textarea
            ref={textAreaRef}
            onFocus={e => {
              e.target.selectionStart = cursorPosition
            }}
            onChange={e => {
              props.onBodyChange(e);
              setCursorPosition(e.target.selectionStart)
              textAreaRef.current.selectionStart = cursorPosition;
            }} value={props.body} />
        </div>
      </Container>
    </Rnd>
  );
};

export default Note;
