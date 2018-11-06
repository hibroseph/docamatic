import React, { Component } from "react";
import styled from "styled-components";
import { removeNote } from "./actions";
import { connect } from 'react-redux';

const Note = ({ body, position, color, onClick }) => {
  console.log("ARE YOU RENDERING")
 
  return (
    <Container>
      style={{
        backgroundColor: color,
        transform: `translate(${position.x}px,${position.y}px)`
      }}>

    <textarea defaultValue={body} />

      <button> onClick={onClick} </button>
    </Container>
  )
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

export default Note
