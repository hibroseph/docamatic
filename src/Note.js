import React, { Component } from "react";
import styled from "styled-components";
import clickdrag from "react-clickdrag";

class Note extends Component {

  render() {
    console.log("PROPS")
    // console.log(this.props.dataDrag)
    // console.log(this.props.dataDrag.isMouseDown)

    let positionX = this.props.position.x + this.props.dataDrag.moveDeltaX;
    let positionY = this.props.position.x + this.props.dataDrag.moveDeltaY;

    if (!this.props.dataDrag.isMouseDown) {
      console.log("YOU ARE NOT MOVING");
    
      // update the position
      // this.props.onPositionChange(this.props.id, positionX, positionY)
    }

    return (
      <Container
        style={{
          backgroundColor: this.props.color,
          transform: `translate(${positionX}px,${positionY}px)`
        }}
        onDragEnd={() => {
          console.log("YOU ENDED DRAGGING IT");
        }}
        onDragStart={() => {
          console.log("You are starting to drag it");
 
        }}
        
        onmouseup={() => {
          console.log("ON MOUSE UP")
        }}>

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

var draggableNote = clickdrag(Note, {
  onDragStop: e => {
    console.log("You stopped moving the component");
    
  }
  // update the state

});

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
