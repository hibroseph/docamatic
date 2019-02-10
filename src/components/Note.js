import React, { Component } from "react";
import clickdrag from "react-clickdrag";
import { NoteContainer } from "../elements/NoteContainer";
import ReactResizeDetector from "react-resize-detector";
import { Icon, Button } from "antd";
import { BlockPicker } from "react-color";
import { NewNoteContainer } from "../elements/NewNoteContainer";

// I'm sorry I used a global
// This is used to see if the note was previously moving
// to see when it stops moving
let globalWidth;
let globalHeight;

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

  refCallback = element => {
    if (element) {
      //   console.log(element.clientHeight);
      //   console.log(element.clientWidth);
    }
  };

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
        console.log("Updating redux store");
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
    globalWidth = this.sizeOfComponent.current.clientWidth;
    globalHeight = this.sizeOfComponent.current.clientHeight;

    // console.log("width: " + globalWidth);
    // console.log("height: " + globalHeight);

    // check to see if the size has changed
    // if (this.state.width != globalWidth || this.state.height != globalHeight) {
    //   this.setState({
    //     width: globalWidth,
    //     height: globalHeight
    //   });
    // }
  }

  render() {

    return (
      <div>
        <NewNoteContainer>
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
              />

              <Icon
                type="bg-colors"
                className="nav-bar-item-color"
                onClick={() => {
                  console.log("you clicked the color button");
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
              onChange={this.props.onBodyChange}
              defaultValue={this.props.body}
            />
            {this.state.colorPickerVisible && (
              <BlockPicker
                className="color-picker"
                onChangeComplete={(color, event) => {
                  this.props.onColorChange(color.hex);
                }}
              />
            )}
          </div>
        </NewNoteContainer>
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
  getSpecificEventData: e => ({
    ctrl: e.ctrlKey,
    shift: e.shiftKey
  })
});

export default draggableNote;
