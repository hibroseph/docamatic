import React, { Component } from "react";
import styled from "styled-components";

class Note extends Component {

  handleClick() {
    console.log("You clicked the note");
  }

  deleteNote() {
    console.log("You want to delete this note");
  }

  render() {
    console.log("calling render")
    const {
      props: {
        note: { body, color, position }
      }
    } = this;

    console.log("body:" + body)
    console.log("color:" + color)
    console.log("position x:" + position.x)
    console.log("position y:" + position.y)

    return (
      <Container
        style={{
          backgroundColor: color,
          transform: `translate(${position.x}px,${position.y}px)`
        }}

      >
        <textarea defaultValue={body} onClick={this.handleClick} />
        <button onClick={this.deleteNote}>Delete</button>
      </Container>
    );
  }
}

const Container = styled.div`
  padding: 20px;
  display: inline-block;
  position: absolute;
  & > textarea {
    width: 300px;
    height: 300px;
    resize: none;
    border: 0px;
    background: transparent;
  }
`;

export default Note;
