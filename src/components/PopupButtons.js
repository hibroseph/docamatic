import React, { Component } from "react";
import { PopupButtonsContainer } from "../elements/PopupButtonsContainer";
import { connect } from "react-redux";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";

class PopupButtons extends Component {
  AddNote() {
    let UUID = generateUUID();
    // console.log("UUID inside of onClick: " + UUID);

    // TODO: Adding loading symbol while were waiting for the response

    // This is used to request the current scroll position from the HTML document
    // When we get the response, then we add the note.
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      console.log("Sending message on: ");
      console.log(tabs);

      chrome.tabs.sendMessage(tabs[0].id, { newNote: "" }, response => {
        console.log("Response:");
        console.log(response);
        // Dispatching action to redux
        this.props.dispatch(
          addNote("Note", UUID, response.scrollPosition, response.page)
        );
      });
    });
  }

  render() {
    return (
      <PopupButtonsContainer>
        <div
          className="button"
          onClick={() => {
            console.log("Adding a new note");
            this.AddNote();
          }}
        >
          Add Note
        </div>

        <input
          className="input"
          placeholder="Search Your Notes"
          onChange={event => this.props.onSearch(event.target.value)}
        />
      </PopupButtonsContainer>
    );
  }
}

export default connect()(PopupButtons);
