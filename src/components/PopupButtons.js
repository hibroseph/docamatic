// THIS FILE IS CURRENTLY NOT USED. I'M KEEPING THIS FILE FOR REFERENCE
import React, { Component } from "react";
import { PopupButtonsContainer } from "../elements/PopupButtonsContainer";
import { connect } from "react-redux";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import * as Sentry from '@sentry/browser'

class PopupButtons extends Component {
  AddNote() {

    Sentry.captureMessage("A user added a note")

    let UUID = generateUUID();
    // console.log("UUID inside of onClick: " + UUID);

    // TODO: Adding loading symbol while were waiting for the response

    // This is used to request the current scroll position from the HTML document
    // When we get the response, then we add the note.

    // eslint-disable-next-line no-undef
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      // console.log("Sending message on: ");
      // console.log(tabs);

      // eslint-disable-next-line no-undef
      chrome.tabs.sendMessage(tabs[0].id, { newNote: "" }, response => {
        // console.log("Response:");
        // console.log(response);

        // if (!response) {
        //   console.log("Your scroll position was equal to undefined");

        //   Sentry.captureMessage("Scroll Position of undefined", "error")
        // }
        // Dispatching action to redux
        try {
        this.props.dispatch(
          addNote("Note", UUID, response.scrollPosition, response.page)
        );
        } catch (err) {
          console.log("An error was captured and reported to sentry");
          console.debug("I think this has to do with the URL and it not being a valid webpage")
          Sentry.captureException(err)
        }
      });
    });
  }

  render() {
    return (
      <PopupButtonsContainer>
        <div
          className="button"
          onClick={() => {
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
