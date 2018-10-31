import React, { Component } from "react";
import styled from "styled-components";
import Note from "./Note";
// import Menu from "./Menu";

class App extends Component {
  state = {
    notes: [
      {
        body: "Sticky note",
        position: { x: 5, y: 300 },
        color: "#f9ffa5"
      },

    ]
  };

  addNote = () => {
    this.setState({
      notes: [
        // TAKE NOTE OF THE ELLIPSES
        // AKA spread operator
        ...this.state.notes,
        {
          position: { x: 100, y: 100 },
          body: "New Note",
          color: "#7fffd4"
        }
      ]
    })

    // ANOTHER WAY OF DOING IT
    // this.setState({
    //   notes:
    //     this.state.notes.concat([
    //       {
    //         position: { x: 100, y: 100 },
    //         body: "New Note",
    //         color: "#7fffd4"
    //       }
    //     ])
    // })
  }

  render() {
    const {
      state: { notes }
    } = this;

    console.log("state: " + this.state.notes)

    return (

      <div>
        <button onClick={this.addNote}>New Note</button>

        <Container>
          {notes.map((note, key) => (
            <Note key={key} note={note} />
          ))}
        </Container>
      </div>
    );

  }
}

const Container = styled.div``;

export default App;
