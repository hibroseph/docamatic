import React, { Component } from "react";
import { PopupStyle as Container, PopupContent } from "../styles/PopupStyle";
import { IconList } from "../components/IconList";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import {
  faStickyNote,
  faSearch,
  faHeart,
  faCog,
  faBell
} from "@fortawesome/free-solid-svg-icons";

import { connect } from "react-redux";

// The list of icons to generate in the side bar
const icons = [
  { type: faStickyNote, name: "sticky" },
  { type: faSearch, name: "search" },
  { type: faHeart, name: "heart" },
  { type: faBell, name: "bell" },
  { type: faCog, name: "cog" }
];

export const Popup = props => {
  return (
    <Container>
      <IconList
        icons={icons}
        onClicky={data => {
          if (data === "sticky") {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
              // eslint-disable-next-line no-undef
              chrome.tabs.sendMessage(tabs[0].id, { newNote: "" }, response => {
                console.log("got a response from the backend");
                console.log(props);
                try {
                  props.addNoteClick(data, response);
                } catch (err) {
                  console.log("uh oh, got an error: " + err);
                }
              });
            });
          }
        }}
      ></IconList>
      <PopupContent></PopupContent>
    </Container>
  );
};

const mapStateToProps = state => {
  return {
    state: state
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addNoteClick: (data, response) =>
      dispatch(
        addNote(data, generateUUID(), response.scrollPosition, response.page)
      )
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Popup);
