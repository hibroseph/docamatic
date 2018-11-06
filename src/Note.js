import React, { Component } from "react";
import styled from "styled-components";

const Note = ({ body, position, color, id, onClick }) => {

  // console.log("Body: " + body)
  // console.log("position: " + position.x + " " + position.y)
  // console.log("color: " + color)

  return (
    <Container style={{
      backgroundColor: color,
      transform: `translate(${position.x}px,${position.y}px)`
    }}>
      <h1>Id: {id}</h1>

      <textarea defaultValue={body} />

      <button onClick={onClick} > Delete </button>
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  display: inline-block;
  position: absolute;
  border-left: 6px solid red;
  & > textarea {
    width: 250px;
    height: 250px;
    resize: none;
    border: 0px;
    background: transparent;
  }
`

export default Note
