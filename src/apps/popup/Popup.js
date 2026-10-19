import React, { useState } from "react";
import { PopupStyle as Container } from "../../components/Popup/style";
import { PopupContent } from "../../components/Popup/PopupContent";
import { IconList } from "../../components/Popup/PopupNavigation/IconList";
import { generateUUID } from "../../utils/GenerateUUID";
import { addNote, trackEvent } from "../../redux/actions";
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

  const CreateNewNote = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const getPageInformation = () => chrome.tabs.sendMessage(tab.id, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION });

    let pageInformation;
    try {
      pageInformation = await getPageInformation();
    } catch {
      // The tab was open before the extension was installed (or updated), so
      // it doesn't have the content script yet. Inject it and retry. The file
      // name contains a build hash, so read it from the manifest.
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: chrome.runtime.getManifest().content_scripts[0].js,
        });
        pageInformation = await getPageInformation();
      } catch (error) {
        // Expected on pages extensions can't script, like chrome:// pages
        console.warn("Unable to add a note to this page: " + error);
        return;
      }
    }

    await props.addNoteClick(pageInformation);
    // The notes UI is only loaded on pages that have notes, and this page
    // might not have had any until now
    chrome.tabs.sendMessage(tab.id, { action: CHROME_MESSAGES.SHOW_NOTES }).catch(() => {});
  };

  const DetermineClick = (data) => {
    if (data === "new") {
      CreateNewNote();
    } else {
      setCurrentPage(data);
      // Which parts of the popup people actually use (search, sort, ...)
      props.trackPageView(data);
    }
  };

  return (
    <Container>
      <IconList icons={icons} page={currentPage} onClicky={(data) => DetermineClick(data)}></IconList>
      <PopupContent page={currentPage} createNewNote={() => CreateNewNote()}></PopupContent>
    </Container>
  );
};

const mapDispatchToProps = (dispatch) => {
  return {
    addNoteClick: (response) => {
      return dispatch(addNote(generateUUID(), response.scrollPosition, GetSafeNoteUrl(response.page)));
    },
    trackPageView: (page) => {
      dispatch(trackEvent("popup_page_viewed", { page }));
    },
  };
};

export default connect(null, mapDispatchToProps)(Popup);
