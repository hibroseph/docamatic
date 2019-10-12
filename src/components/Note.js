import React, { Component } from "react";
import { Rnd } from "react-rnd";
import { NoteContainer as Container } from "../styles/NoteStyles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPalette,
  faArrowsAlt,
  faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import ColorSwatch from "./ColorSwatch";

class Note extends Component {
  constructor(props) {
    super(props);

    this.state = {
      colorPicker: false
    };
  }

  render() {
    return (
      <Rnd
        default={{
          x: this.props.position.x,
          y: this.props.position.y,

          width: this.props.size.width,
          height: this.props.size.height
        }}
        onDragStop={(e, d) =>
          this.props.onPositionChange(this.props.id, d.x, d.y)
        }
        onResizeStop={(e, d, ref, delta, position) => {
          this.props.onSizeChange(
            this.props.size.width + delta.width,
            this.props.size.height + delta.height
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
        <Container color={this.props.color}>
          <div className="title">
            <input
              style={{ margin: 0 }}
              value={this.props.title}
              onChange={this.props.onTitleChange}
            />
            <FontAwesomeIcon className="arrow icons" icon={faArrowLeft} />

            <div className="settings-container">
              <FontAwesomeIcon
                className="icons"
                icon={faPalette}
                onClick={() => {
                  this.setState({
                    colorPicker: !this.state.colorPicker
                  });
                }}
              />
              <FontAwesomeIcon
                onClick={this.props.onDeleteClick}
                className="icons"
                icon={faTrashAlt}
              />
              <FontAwesomeIcon
                className="drag-handle icons"
                icon={faArrowsAlt}
              />
            </div>
          </div>
          {this.state.colorPicker && (
            <ColorSwatch
              visible={this.state.colorPicker}
              colors={this.props.colors}
              onColorChange={color => this.props.onColorChange(color, null)}
              onMouseLeave={() => {
                this.setState({
                  colorPicker: false
                });
              }}
            ></ColorSwatch>
          )}

          <div className="body">
            <textarea
              onChange={this.props.onBodyChange}
              value={this.props.body}
            />
          </div>
        </Container>
      </Rnd>
    );
  }
}

export default Note;
