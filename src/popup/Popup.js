import React, { useState } from "react";
import { PopupStyle as Container } from "../components/Popup/style";
import { PopupContent } from "../components/Popup/PopupContent";
import { IconList } from "../components/Popup/PopupNavigation/IconList";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import {
  faStickyNote,
  faSearch,
  faHeart,
  faCog,
  faBell,
  faCompass,
  faSortAmountDown
} from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";

// The list of icons to generate in the side bar
const icons = [
  { type: faStickyNote, name: "new" },
  { type: faCompass, name: "current" },
  { type: faSearch, name: "search" },
  { type: faSortAmountDown, name: "sort" },
  { type: faHeart, name: "hearted" },
  // { type: faBell, name: "alerts" },
  // { type: faCog, name: "settings" }
];

export const Popup = props => {

  const [currentPage, setCurrentPage] = useState("current");

  const CreateNewNote = (data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      // eslint-disable-next-line no-undef
      chrome.tabs.sendMessage(tabs[0].id, { newNote: "" }, response => {
        try {
          props.addNoteClick(data, response);
        } catch (err) {
        }
      });
    })
  }

  const DetermineClick = (data) => {
    if (data === "new") {
      CreateNewNote("Note");
    } else {
      setCurrentPage(data);
    }
  }

  return (
    <Container>
      <IconList
        icons={icons}
        page={currentPage}
        onClicky={data => DetermineClick(data)}
      ></IconList>
      <PopupContent
        page={currentPage}
        createNewNote={() => CreateNewNote("new")}
      ></PopupContent>
    </Container>
  );
}


const mapDispatchToProps = dispatch => {
  return {
    addNoteClick: (data, response) =>
      dispatch(
        addNote(data, generateUUID(), response.scrollPosition, response.page)
      )
  };
};

export default connect(
  null,
  mapDispatchToProps
)(Popup);
