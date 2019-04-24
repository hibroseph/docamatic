import React, { Component } from "react";
import clickdrag from "react-clickdrag";
import { NoteContainer } from "../elements/NoteContainer";
import { Icon, Button } from "antd";
import { BlockPicker } from "react-color";

// I'm sorry I used a global
// This is used to see if the note was previously moving
// to see when it stops moving
// let globalWidth;
// let globalHeight;

class Note extends Component {
  constructor(props) {
    super(props);

    this.sizeOfComponent = React.createRef();

    console.log(
      "size props width: " +
        this.props.size.width +
        " height: " +
        this.props.size.height
    );

    // Using a local state to assist in moving dem
    this.state = {
      currentX: this.props.position.x,
      currentY: this.props.position.y,
      lastPositionX: 0,
      lastPositionY: 0,
      colorPickerVisible: false,
      width: this.props.size.width,
      height: this.props.size.height
    };
  }

  componentWillReceiveProps(nextProps) {
    // If its moving and the control key is down, update the state
    if (nextProps.dataDrag.isMoving && nextProps.dataDrag.ctrl) {
      this.setState({
        currentX: this.state.lastPositionX + nextProps.dataDrag.moveDeltaX,
        currentY: this.state.lastPositionY + nextProps.dataDrag.moveDeltaY
      });
    } else {
      // Update the local state for changes
      this.setState({
        lastPositionX: this.state.currentX,
        lastPositionY: this.state.currentY
      });

      // Only update the global store when it has stopped moving
      if (!nextProps.dataDrag.isMoving && this.props.dataDrag.isMoving) {
        // Update the global store
        this.props.onPositionChange(
          this.props.id,
          this.state.currentX,
          this.state.currentY
        );
      }
    }
  }

  componentDidUpdate() {
    // globalWidth = this.sizeOfComponent.current.clientWidth;
    // globalHeight = this.sizeOfComponent.current.clientHeight;

    // console.log("Width: " + globalWidth);
    // console.log("Height: " + globalHeight);

    // check to see if the size has changed
    if (
      this.state.width != this.sizeOfComponent.current.clientWidth ||
      this.state.height != this.sizeOfComponent.current.clientHeight
    ) {
      this.setState({
        width: this.sizeOfComponent.current.clientWidth,
        height: this.sizeOfComponent.current.clientHeight
      });

      this.props.onSizeChange(
        this.props.id,
        this.state.width,
        this.state.height
      );
    }
  }

  render() {
    return (
      <div>
        <NoteContainer>
          <div
            className="note"
            style={{
              transform: `translate(${this.state.currentX}px, ${
                this.state.currentY
              }px)`,
              width: this.state.width,
              height: this.state.height
            }}
            ref={this.sizeOfComponent}
          >
            <div
              className="title-bar"
              style={{ backgroundColor: this.props.color }}
            >
              <input
                className="title-input"
                placeholder="Note"
                defaultValue={this.props.title}
                onClick={() => {
                  this.setState({
                    colorPickerVisible: false
                  });
                }}
                onChange={this.props.onTitleChange}
                onMouseDown={() => {
                  // console.log("The mouse is down");
                }}
                onMouseUp={() => {
                  // console.log("the mouse is up");
                }}
                onMouseMove={() => {
                  // console.log("the mouse is moving");
                  // console.log(event);
                }}
              />

              <Icon
                type="bg-colors"
                className="nav-bar-item-color"
                onClick={() => {
                  // console.log("you clicked the color button");
                  this.setState({
                    colorPickerVisible: true
                  });
                }}
              />

              <Icon
                className="nav-bar-item-delete"
                type="delete"
                onClick={this.props.onDeleteClick}
              />
            </div>

            <textarea
              className="note-input"
              onClick={() => {
                this.setState({
                  colorPickerVisible: false
                });
              }}
              onDoubleClick={() => {
                // console.log("you clicked twice nigga!");
              }}
              onChange={this.props.onBodyChange}
              defaultValue={this.props.body}
            />
            {this.state.colorPickerVisible && (
              <BlockPicker
                className="color-picker"
                color={this.props.color}
                onChangeComplete={(color, event) => {
                  this.props.onColorChange(color.hex);
                }}
              />
            )}
          </div>
        </NoteContainer>
      </div>
    );
  }
}

// // Make the note draggable
var draggableNote = clickdrag(Note, {
  onDragStop: () => {
    // update the state of the position of this note here
    // and size
  },
  onDragStart: () => {
    console.log("dragging");
  },
  getSpecificEventData: e => ({
    ctrl: e.ctrlKey,
    shift: e.shiftKey
  })
});

export default draggableNote;
