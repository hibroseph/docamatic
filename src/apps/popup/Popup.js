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
import { TEST_IDS } from "../../utils/testIds";
import styled from "styled-components";

const SafeModeBanner = styled.div`
  padding: 20px;
  line-height: 1.5;
  button {
    margin-top: 10px;
    border: none;
    border-radius: 5px;
    padding: 8px 14px;
    background-color: #08597d;
    color: white;
    cursor: pointer;
  }
`;

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

  // The background couldn't load the notes safely (see safe mode in
  // apps/background/background.js), so nothing here would work
  if (props.safeMode) {
    return (
      <Container>
        <SafeModeBanner data-testid={TEST_IDS.popupSafeModeBanner}>
          <h3>Docamatic is in safe mode</h3>
          <p>
            Your notes couldn't be loaded safely after an update, so Docamatic isn't showing or changing them. They are
            still saved on this computer.
          </p>
          <p>Please download a backup and email it to sticknoteapp@gmail.com so we can help.</p>
          <button onClick={() => chrome.runtime.openOptionsPage()}>Backup &amp; Restore</button>
        </SafeModeBanner>
      </Container>
    );
  }

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

const mapStateToProps = (state) => ({
  safeMode: state.metadata?.safe_mode,
});

export default connect(mapStateToProps, mapDispatchToProps)(Popup);
