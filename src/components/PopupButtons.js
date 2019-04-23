import React, { Component } from "react";
import { PopupButtonsContainer } from "../elements/PopupButtonsContainer";
import { connect } from "react-redux";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import * as Sentry from '@sentry/browser'

class PopupButtons extends Component {
  AddNote() {
    let UUID = generateUUID();
    // console.log("UUID inside of onClick: " + UUID);

    // TODO: Adding loading symbol while were waiting for the response

    // This is used to request the current scroll position from the HTML document
    // When we get the response, then we add the note.

    // eslint-disable-next-line no-undef
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      console.log("Sending message on: ");
      console.log(tabs);

      // eslint-disable-next-line no-undef
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
            console.log("Creating a new note that doesn't exist");

            Sentry.captureMessage('A user added a note');

            this.AddNote();
          }}
        >
          New Note
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
