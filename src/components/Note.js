import React from "react";
import { Rnd } from "react-rnd";
import { NoteContainer as Container } from "../styles/NoteStyles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowsAlt,
  faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import ColorSwatch from "./ColorSwatch";
import { getContrastingColor } from "../utils/ContrastingColor";

const Note = props => {
  let contrastingColor = getContrastingColor(props.color);

  return (
    <Rnd
      default={{
        x: props.position.x,
        y: props.position.y,

        width: props.size.width,
        height: props.size.height
      }}
      onDragStop={(e, d) => props.onPositionChange(props.id, d.x, d.y)}
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
    >
      <Container contrastingColor={contrastingColor} color={props.color}>
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
                onClick={props.onDeleteClick}
                className="icons"
                icon={faTrashAlt}
              />
              <FontAwesomeIcon
                className="drag-handle icons"
                icon={faArrowsAlt}
              />
            </div>
            <ColorSwatch
              colors={props.colors}
              onColorChange={color => props.onColorChange(color, null)}
            ></ColorSwatch>
          </div>
        </div>

        <div className="body">
          <textarea onChange={props.onBodyChange} value={props.body} />
        </div>
      </Container>
    </Rnd>
  );
};

export default Note;
