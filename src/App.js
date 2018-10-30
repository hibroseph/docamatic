import React, { Component } from "react";
import styled from "styled-components";
import Note from "./Note";

class App extends Component {
  state = {
    notes: [
      {
        body: "Sticky note",
        position: { x: 100, y: 100 },
        color: "#f9ffa5"
      }
    ]
  };

  render() {
    const {
      state: { notes }
    } = this;

    return (
      <Container>
        {notes.map((note, key) => (
          <Note key={key} note={note} />
        ))}
      </Container>
    );
  }
}

const Container = styled.div``;

export default App;
