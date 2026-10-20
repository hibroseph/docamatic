import React, { useState } from "react";
import { PopupStyle as Container } from "../../components/Popup/style";
import { PopupContent } from "../../components/Popup/PopupContent";
import { IconList } from "../../components/Popup/PopupNavigation/IconList";
import { generateUUID } from "../../utils/GenerateUUID";
import { addNote, trackEvent } from "../../redux/actions";
import { faStickyNote, faSearch, faHeart, faCog, faBell, faCompass, faSortAmountDown } from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";
import { CHROME_MESSAGES } from "../../utils/constants";
import { noteUrlFor, redactUrl } from "../../utils/noteUrl";
import { TEST_IDS } from "../../utils/testIds";
import { captureMessage } from "../../utils/sentry";
import { canHaveNotes, hostnameOf, isExpectedScriptingError, messageWithoutUrls } from "../../utils/expectedFailures";
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

  // Creating a note is the core flow, so each step is measured: a funnel of
  // note_create_started -> note_created -> note_shown in PostHog shows how
  // often it works, and note_create_failed says where it breaks. Failures that
  // aren't expected (i.e. bugs) also go to Sentry.
  const CreateNewNote = async () => {
    props.track("note_create_started");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const fail = (stage, expected, error) => {
      props.track("note_create_failed", { stage, expected });
      if (!expected) {
        captureMessage("Creating a note failed", {
          stage,
          page_host: hostnameOf(tab?.url),
          error: error ? messageWithoutUrls(error) : undefined,
        });
      }
    };

    // chrome:// pages, the extension stores, ...: no extension can add to these
    if (!tab || !canHaveNotes(tab.url)) {
      fail("page_not_supported", true);
      return;
    }

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
      } catch (error) {
        // Often expected (e.g. a page Chrome won't let extensions script)
        fail("add_content_script", isExpectedScriptingError(error), error);
        return;
      }
      try {
        pageInformation = await getPageInformation();
      } catch (error) {
        // The script was added but the page still doesn't answer: always a bug
        fail("page_unresponsive", false, error);
        return;
      }
    }

    // The background shows the notes UI in every tab with this page open
    // once the note is added (see showNotesWhenPagesGainNotes)
    props.addNoteClick(pageInformation);
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
      return dispatch(addNote(generateUUID(), response.scrollPosition, noteUrlFor(response.page), redactUrl(response.page)));
    },
    trackPageView: (page) => {
      dispatch(trackEvent("popup_page_viewed", { page }));
    },
    track: (event, properties) => {
      dispatch(trackEvent(event, properties));
    },
  };
};

const mapStateToProps = (state) => ({
  safeMode: state.metadata?.safe_mode,
});

export default connect(mapStateToProps, mapDispatchToProps)(Popup);
