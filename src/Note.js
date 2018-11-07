import React, { Component } from "react";
import styled from "styled-components";

const Note = ({ title, body, position, color, id, onClick, onNoteChange,
onTitleChange}) => {

  return (
    <Container style={{
      backgroundColor: color,
      transform: `translate(${position.x}px,${position.y}px)`
    }} >

      <span className="inline">
        {/* Title */}
        <textarea id="note_title"
          defaultValue={(title) || "New Note"}
          onChange={onTitleChange}
        />

        {/* Note Area */}
        <textarea id="note_bod"
          defaultValue={body}
          onChange={onNoteChange}
        />
      </span>

      <button onClick={onClick} > Delete </button>
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
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
`

export default Note
