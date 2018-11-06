import React, { Component } from "react";
import styled from "styled-components";

const Note = ({ body, position, color, onClick }) => {

  // console.log("Body: " + body)
  // console.log("position: " + position.x + " " + position.y)
  // console.log("color: " + color)

  return (
    <Container style={{
      backgroundColor: color,
      transform: `translate(${position.x}px,${position.y}px)`
    }}>
    

    <textarea defaultValue={body} />

      <button onClick={onClick} > Delete </button>
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  display: inline-block;
  position: absolute;
  border-style:solid;
  & > textarea {
    width: 300px;
    height: 300px;
    resize: none;
    border: 0px;
    background: transparent;
  }
`

export default Note
