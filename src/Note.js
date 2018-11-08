import React, { Component } from "react";
import styled from "styled-components";
import clickdrag from "react-clickdrag";

class Note extends Component {
  render() {
    let positionX = this.props.position.x
    let positionY = this.props.position.y

    // This was added because the render was running 1 time after the position updating
    // in the state, resulting in the note to jump by DeltaX and DeltaY since they were
    // still the same but the position.x actually updated
    if (this.props.dataDrag.isMoving) {
      positionX = this.props.position.x + this.props.dataDrag.moveDeltaX;
      positionY = this.props.position.y + this.props.dataDrag.moveDeltaY;
    }

    return (
      <Container
        style={{
          backgroundColor: this.props.color,
          transform: `translate(${positionX}px,${positionY}px)`
        }}
        onMouseUp={() => {
          console.log("The mouse was released, updating position as: " + positionX + " ," + positionY)
          this.props.onPositionChange(this.props.id, positionX, positionY);
        }}
      >
        <span className="inline">
          {/* Title */}
          <textarea
            id="note_title"
            defaultValue={this.props.title || "New Note"}
            onChange={this.props.onTitleChange}
          />

          {/* Note Area */}
          <textarea
            id="note_bod"
            defaultValue={this.props.body}
            onChange={this.props.onNoteChange}
          />

          <button onClick={this.props.onClick}> Delete </button>
        </span>
      </Container>
    );
  }
}

// Make the note draggable
var draggableNote = clickdrag(Note);

// Styling for the note etc
const Container = styled.div`
  padding-left: 20px;
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 5px;
  display: inline-block;
  position: absolute;
  border-left: 6px solid red;

  #note_title {
    height: 30px;
    width: 250px;
    border: 0px;
    font-weight: bold;
    resize: none;
    background: transparent;
    font-size: 30px;
    padding-bottom: 10px;
  }

  #note_bod {
    width: 250px;
    height: 250px;
    resize: none;
    border: 0px;
    background: transparent;
  }

  .inline {
    display: inline-block;
    width: 250px;
  }
`;

export default draggableNote;
