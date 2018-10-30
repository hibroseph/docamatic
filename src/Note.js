import React, { Component } from "react";
import styled from "styled-components";

class Note extends Component {
  render() {
    const {
      props: {
        note: { body, color, position }
      }
    } = this;

    return (
      <Container
        style={{
          backgroundColor: color,
          transform: `translate(${position.x}px,${position.y}px)`
        }}
      >
        <textarea defaultValue={body} />
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
