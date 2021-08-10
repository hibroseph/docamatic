import React, { useState, useEffect } from "react";
import { PopupStyle as Container } from "../components/Popup/style";
import { PopupContent } from "../components/Popup/PopupContent";
import { IconList } from "../components/Popup/PopupNavigation/IconList";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import { faStickyNote, faSearch, faHeart, faCog, faBell, faCompass, faSortAmountDown } from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";
import { CHROME_MESSAGES } from "../utils/constants";

// The list of icons to generate in the side bar
const icons = [
  { type: faStickyNote, name: "new" },
  { type: faCompass, name: "current" },
  { type: faSearch, name: "search" },
  { type: faSortAmountDown, name: "sort" },
  { type: faHeart, name: "hearted" },
  { type: faCog, name: "settings" },
];

export const Popup = (props) => {
  const [currentPage, setCurrentPage] = useState("current");

  useEffect(() => {
    console.log("loading popup");
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action == CHROME_MESSAGES.ERROR_OCCURRED) {
        console.error("AN ERROR OCCURRED DAMMIT");
      }
    });
  });
  const CreateNewNote = (data) => {
    console.log(props);
    console.log("attempting to add note to page");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("querying bby");
      // eslint-disable-next-line no-undef
      chrome.tabs.sendMessage(tabs[0].id, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION }, (response) => {
        console.log("sending msg");
        try {
          props.addNoteClick(data, response);
        } catch (err) {
          console.log("failed to send msg", err);
        }
      });
    });
  };

  const DetermineClick = (data) => {
    if (data === "new") {
      CreateNewNote("Note");
    } else {
      setCurrentPage(data);
    }
  };

  return (
    <Container>
      <IconList icons={icons} page={currentPage} onClicky={(data) => DetermineClick(data)}></IconList>
      <PopupContent page={currentPage} createNewNote={() => CreateNewNote("Note")}></PopupContent>
    </Container>
  );
};

const mapDispatchToProps = (dispatch) => {
  return {
    addNoteClick: (data, response) => {
      console.log("maping dispatch to props");
      dispatch(addNote(data, generateUUID(), response.scrollPosition, response.page));
    },
  };
};

export default connect(null, mapDispatchToProps)(Popup);
