import React, { Component } from "react";
import clickdrag from "react-clickdrag";
import trash_can from "../assets/delete.png";
import { NoteContainer } from "../elements/NoteContainer";
import { Button } from "../elements/Button";
import ReactResizeDetector from "react-resize-detector";
import { Menu, Dropdown, Icon } from "antd";

// I'm sorry I used a global
// This is used to see if the note was previously moving
// to see when it stops moving
let globalWidth;
let globalHeight;

class Note extends Component {
  constructor(props) {
    super(props);

    this.sizeOfComponent = React.createRef();
  }

  refCallback = element => {
    if (element) {
      console.log(element.clientHeight);
    }
  };

  componentDidUpdate() {
    // console.log("component updated");
    // console.log(this.sizeOfComponent.current.cl);
    globalWidth = this.sizeOfComponent.current.clientWidth;
    globalHeight = this.sizeOfComponent.current.clientHeight;

    // console.log("!! " + width + " " + height);

    // console.log("this.props.size.width: " + this.props.size.width)
    // console.log("sizeOfComponent.width: " + width);

    // console.log("this.props.size.height: " + this.props.size.height)
    // console.log("sizeOfComponent.height: " + height);

    // if (!this.props.size.width == width && this.props.size.height == height) {
    //   console.log("The width or height has changed! Updating");
    //   this.props.onSizeChange(this.props.id, width, height);
    // } else {
    //   console.log("The width and height hasn't changed");
    // }
  }

  render() {
    // console.log("Rerendering note");

    let positionX = this.props.position.x;
    let positionY = this.props.position.y;

    // This was added because the render was running 1 time after the position updating
    // in the state, resulting in the note to jump by DeltaX and DeltaY since they were
    // still the same but the position.x actually updated
    // console.log("CTRL " + this.props.dataDrag.ctrl);
    if (this.props.dataDrag.isMoving && this.props.dataDrag.ctrl) {
      positionX = this.props.position.x + this.props.dataDrag.moveDeltaX;
      positionY = this.props.position.y + this.props.dataDrag.moveDeltaY;
    }

    return (
      <NoteContainer
        className={"dragable_note"}
        style={{
          backgroundColor: this.props.color,
          transform: `translate(${positionX}px,${positionY}px)`
        }}
        // ref={() => { console.log("ref")}}
        onMouseUp={() => {
          if (this.props.dataDrag.isMoving) {
            console.log(
              "The mouse was released, updating position as: " +
                positionX +
                " ," +
                positionY
            );
            this.props.onPositionChange(this.props.id, positionX, positionY);

            console.log("Updating the size!!!!");
            this.props.onSizeChange(this.props.id, globalWidth, globalHeight);
            // clicked = true;
            // globalHeight = globalHeight - 75;

            // this.props.onSizeChange(this.props.id, globalWidth, globalHeight);
          }
          // globalHeight = globalHeight -75;
        }}
        onClick={() => {
          // console.log("You clicked the container somewhere!");
          // console.log("We should probably bring it to the top");
          // this.props.onPositionChange(this.props.id, positionX, positionY);
          // clicked = true;
        }}
      >
        <div className="title_bar">
          {/* Title */}
          <input
            type="text"
            className="note_title"
            defaultValue={this.props.title || "New Note"}
            onChange={this.props.onTitleChange}
          />

          <Icon
            type="delete"
            className="menu_icons"
            onClick={this.props.onDeleteClick}
            alt="trash"
          />

          {/* <img
            src={trash_can}
            className="menu_icons"
            alt="trash"
            onClick={this.props.onDeleteClick}
          /> */}
        </div>

        {/* Note Area */}
        {/* <div ref={this.refCallback}> */}
        <textarea
          className="note_body"
          defaultValue={this.props.body}
          onChange={this.props.onBodyChange}
          style={{
            width: this.props.size.width,
            height: this.props.size.height
          }}
          ref={this.sizeOfComponent}
        />
        {/* </div> */}

        <Button onClick={this.props.onColorChange}>Color</Button>
      </NoteContainer>
    );
  }
}

// // Make the note draggable
var draggableNote = clickdrag(Note, {
  onDragStop: () => {
    // update the state of the position of this note here
    // and size
    // console.log("onDragStop:");
    // console.log( sizeOfComponent );
  },
  getSpecificEventData: e => ({
    ctrl: e.ctrlKey,
    shift: e.shiftKey
  })
});

export default draggableNote;

// export default Note;
