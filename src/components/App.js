import React, { Component } from "react";
import styled from "styled-components";
import NoteList from "./NoteList";


class App extends Component {
  render() {
    return (
      <div>
        <NoteList />
      </div>
    );
  }
}

const Container = styled.div`
  box-sizing: border-box;
  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }
`;
export default App;
