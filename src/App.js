import React, { Component } from "react";
import styled from "styled-components";
import NoteList from "./NoteList"
import NewNote from "./NewNote"

class App extends Component {

  render() {
    return (
        <div>
          <NewNote />
          <NoteList />
        </div>
    );
  }
}

const Container = styled.div``;

export default App