import React, { Component } from "react";
import { IconBarContainer } from "../elements/IconBarContainer";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import { connect } from "react-redux";
import { Button } from "antd";

class IconBar extends Component {
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
      <IconBarContainer>
        
        <div className="icon-bar">
          <div
            className="icon-bar-item"
            onClick={() => {
              console.log("Calling this.AddNote()");

              this.AddNote();
            }}
          >
            New Note
          </div>
        </div>
      </IconBarContainer>
    );
  }
}

export default connect()(IconBar);
