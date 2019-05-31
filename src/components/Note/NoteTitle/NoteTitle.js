import React from "react";
import "./NoteTitle.css";
import { Icon } from "antd";

const NoteTitle = props => {
  return (
    <div>
      <div
        className="note-drag-handle"
        style={{ backgroundColor: props.accentColor }}
      />
      <div className="title-bar" style={{ backgroundColor: props.color }}>
        <input
          className="title-input"
          placeholder="Note"
          defaultValue={props.title}
          style={{ color: props.textColor }}
          onClick={() => {
            props.updateFocus("note")
          }}
          onChange={props.onChange}
          onMouseDown={e => {
            e.stopPropagation();
          }}
        />

        <Icon
          type="bg-colors"
          className="nav-bar-item-color"
          style={{ color: props.textColor }}
          onClick={() => {
            props.updateFocus("color");
          }}
        />

        <Icon
          type="delete"
          className="nav-bar-item-delete"
          style={{ color: props.textColor }}
          onClick={props.onDeleteClick}
        />
      </div>
    </div>
  );
};

export default NoteTitle;
