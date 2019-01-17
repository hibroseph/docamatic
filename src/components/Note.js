import React, { Component } from "react";
import clickdrag from "react-clickdrag";
import trash_can from "../assets/delete.png";
import { NoteContainer } from "../elements/NoteContainer";
import { Button } from "../elements/Button";
import ReactResizeDetector from "react-resize-detector";
import { Menu, Dropdown, Icon } from "antd";
import { CirclePicker } from "react-color";

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
      settingsVisible: false,
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
    console.log("this.state:");
    console.log(this.state);

    // If the settings button isn't clicked
    if (!this.state.settingsVisible) {
      return (
        <NoteContainer
          className={"dragable_note"}
          style={{
            backgroundColor: this.props.color,
            transform: `translate(${this.state.currentX}px,${
              this.state.currentY
            }px)`,
            width: this.state.width,
            height: this.state.height
          }}
          // ref={() => { console.log("ref")}}
          onMouseUp={() => {
            if (this.props.dataDrag.isMoving) {
              this.props.onSizeChange(this.props.id, globalWidth, globalHeight);
            }
          }}
        >
          <div id={"note"}>
            <div className="nav">
              {/* Title */}

              <input
                type="text"
                id="title"
                defaultValue={this.props.title || "New Note"}
                onChange={this.props.onTitleChange}
              />

              <Icon
                type="delete"
                id="delete"
                onClick={this.props.onDeleteClick}
                alt="trash"
              />

              <a
                id="settings"
                onClick={() => {
                  // console.log("Opening the settings page");
                  // change the state to view the settings page
                  this.setState({
                    settingsVisible: true
                  });
                }}
              >
                Settings
              </a>
            </div>

            <textarea
              id={"note-body"}
              defaultValue={this.props.body}
              onChange={this.props.onBodyChange}
              ref={this.sizeOfComponent}
            />
          </div>
        </NoteContainer>
      );
    } else {
      // The settings page
      return (
        <NoteContainer
          id={"settingsNote"}
          className={"dragable_note"}
          style={{
            backgroundColor: this.props.color,
            transform: `translate(${this.state.currentX}px,${
              this.state.currentY
            }px)`,
            width: this.state.width,
            height: this.state.height
          }}
          // ref={() => { console.log("ref")}}
          onMouseUp={() => {
            if (this.props.dataDrag.isMoving) {
              this.props.onSizeChange(this.props.id, globalWidth, globalHeight);
            }
          }}
          ref={this.sizeOfComponent}
        >
          <div id={"settings-page"}>
            <p id={"settings-title"}> Settings page </p>

            <p id={"settings-items"}>Note Color</p>

            <div id={"color-picker"}>
              <CirclePicker
                onChangeComplete={(color, event) => {
                  this.props.onColorChange(color.hex);
                }}
              />
            </div>

            <div id={"settings-footer"}>
              <button
                id={"settings-save"}
                onClick={() => {
                  this.setState({
                    settingsVisible: false
                  });
                }}
              >
                Save
              </button>
            </div>
          </div>
        </NoteContainer>
      );
    }
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
