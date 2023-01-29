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
import styled from "styled-components";

const PopupError = styled.div`
  padding: 20px;
  background-color: #ec4646;
  border-radius: 15px;
  position: absolute;
  width: 50%;
  left: 25%;
  bottom: -120px;
  height: 80px;
  font-size: 15px;
  font-weight: bold;
  color: white;
  box-shadow: 0 0 17px rgba(0, 0, 0, 0.3);
  -webkit-box-shadow: 0 0 17px rgba(0, 0, 0, 0.3);
  -moz-box-shadow: 0 0 17px rgba(0, 0, 0, 0.3);
  animation: route 0.5s forwards;

  @keyframes route {
    0% {
      transform: translateY(0);
    }

    100% {
      transform: translateY(-140px);
    }
  }
`;
// The list of icons to generate in the side bar
const icons = [
  { type: faStickyNote, name: "new", title: "Create New Note" },
  { type: faCompass, name: "current", title: "Notes on Current Page" },
  { type: faSearch, name: "search", title: "Search Notes" },
  { type: faSortAmountDown, name: "sort", title: "Filter Notes" },
  { type: faHeart, name: "hearted", title: "Liked Notes" },
  { type: faCog, name: "settings", title: "Settings" },
];

export const Popup = (props) => {
  const [currentPage, setCurrentPage] = useState("current");
  const [showError, setShowError] = useState({ show: false, message: "", report: false, showTimeMs: 0, timer: undefined });

  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action == CHROME_MESSAGES.ERROR_OCCURRED) {
        console.error("AN ERROR OCCURRED DAMMIT");
      }
    });
  });
  const CreateNewNote = (data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs
        .sendMessage(tabs[0].id, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION })
        .then((response) => props.addNoteClick(response))
        .catch((e) => {
          chrome.scripting
            .executeScript({
              target: { tabId: tabs[0].id },
              files: ["[[script.js]]"],
            })
            .then(() => {
              chrome.tabs.sendMessage(tabs[0].id, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION }).then((response) => props.addNoteClick(response));
            })
            .catch((error) => {
              setTimeout(() => {
                console.log("setting timeout for not showing error");
                setShowError({ show: false });
              }, 10000);

              setShowError({ show: true, message: "An error occurred while attempting to create a note: " + error, showTimeMs: 10000 });
              console.error("another error occurred " + error);
            });
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
      {showError.show && <PopupError>{showError.message}</PopupError>}
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
