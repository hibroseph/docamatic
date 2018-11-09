import React, { Component } from "react";
import styled, { css } from "styled-components";
import clickdrag from "react-clickdrag";
import ColorButton from './ColorButton'

class Note extends Component {
  render() {

    console.log("Rerendering note")

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
          if (this.props.dataDrag.isMoving) {
            console.log("The mouse was released, updating position as: " + positionX + " ," + positionY)
            this.props.onPositionChange(this.props.id, positionX, positionY);
          }
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

          {/* <ColorButton onClick={this.props.onColorChange(this.props.id)}></ColorButton> */}

          <Button color onClick={this.props.onColorChange}>Color</Button>
          <Button onClick={this.props.onDeleteClick}> Delete </Button>
        </span>
      </Container>
    );
  }
}

// Make the note draggable
var draggableNote = clickdrag(Note);

// Styling for the note etc

const Button = styled.button`
    background-color: #e74545;
    color: white;
    padding: 25px;
    padding-top: 6px;
    padding-bottom: 6px;
    font-size: 16px;
    border-radius: 7px;
    border: none;
    float: right;
    text-align: center;
    
  

    ${props => props.color && css`
      background-color: #4caf50;
      float left;
    `}

`;

const Container = styled.div`
  padding-left: 20px;
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 5px;
  display: inline-block;
  position: absolute;

  -webkit-box-shadow: 5px 5px 13px -3px rgba(0,0,0,0.75);
  -moz-box-shadow: 5px 5px 13px -3px rgba(0,0,0,0.75);
  box-shadow: 5px 5px 13px -3px rgba(0,0,0,0.75);

  height: 400px;
  width: 250px;
  

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
    box-sizing: border-box;
    width: 250px;
    height: 315px;
    

    resize: none;
    border: 0px;
    background: transparent;
  }

  .inline {
    display: inline-block;
    width: 250px;
  }


  .colorChange {
    background-color: #4caf50;
    padding-left: 20px;
    float: none;
  }

  .resizeableText {
    width: 100%;
    height: 100%;
  }
`;

export default draggableNote;
