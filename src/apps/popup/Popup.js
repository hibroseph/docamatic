import React, { useState, useEffect } from "react";
import { PopupStyle as Container } from "../../components/Popup/style";
import { PopupContent } from "../../components/Popup/PopupContent";
import { IconList } from "../../components/Popup/PopupNavigation/IconList";
import { generateUUID } from "../../utils/GenerateUUID";
import { addNote } from "../../redux/actions";
import { faStickyNote, faSearch, faHeart, faCog, faBell, faCompass, faSortAmountDown } from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";
import { CHROME_MESSAGES } from "../../utils/constants";
import { GetSafeNoteUrl } from "../../utils/GetSafeNoteUrl";

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
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action == CHROME_MESSAGES.ERROR_OCCURRED) {
        console.error("AN ERROR OCCURRED DAMMIT");
      }
    });
  });
  const CreateNewNote = (data) => {
    chrome.tabs.query({ active: true, currentWindow: true  }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION })
      .then((response) => props.addNoteClick(response))
      .catch(e => {
       
        chrome.scripting.executeScript(
          {
            target: {tabId: tabs[0].id},
            files: ['[[script.js]]'],
          })
          .then(() => {
            chrome.tabs.sendMessage(tabs[0].id, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION })
            .then((response) => props.addNoteClick(response))
          })
          .catch(error => console.error("another error occurred " + error));
      })
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
    addNoteClick: (response) => {
      dispatch(addNote(generateUUID(), response.scrollPosition, GetSafeNoteUrl(response.page)));
    },
  };
};

export default connect(null, mapDispatchToProps)(Popup);
