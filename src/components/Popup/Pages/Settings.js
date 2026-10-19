import React from "react";
import styled from "styled-components";
import { PageTitle } from "../style";
import config from "../../../../config.json";
import { MessageHeader, SubMessage } from "../Pages/CurrentPageNotes/style";
import { connect } from "react-redux";
import { nukeNotes, setAnalyticsEnabled } from "../../../redux/actions";
import PopupWindow from "../PopupWindow";
import { useState } from "react";
import { TEST_IDS } from "../../../utils/testIds";

const SettingButton = styled.button`
  border: none;
  background-color: #f4f4f4;
  border-radius: 5px;
  padding: 5px 10px;
  &:hover {
    background-color: #f1f1f1;
  }
`;

const HorizontalItems = styled.div`
display flex; 
justify-content: space-around;
align-items: center;`;

const PopupContent = styled.div`
  padding: 10px;
`;

const Settings = (props) => {
  const [showPopup, setPopupVisibility] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  const NukeNotes = () => {
    setPopupContent(GetNukeConfirmationPopup());
    setPopupVisibility(true);
  };

  const AreYouSureYouWantToNukeConfirmation = () => {
    props.nukeNotes();
    ClosePopup();
  };

  const ClosePopup = () => {
    setPopupVisibility(false);
  };

  const GetNukeConfirmationPopup = () => {
    return {
      jsx: (
        <div>
          <SubMessage>This will delete all your notes. A backup is saved first, which you can restore from Backup &amp; Restore.</SubMessage>
          <HorizontalItems>
            <SettingButton data-testid={TEST_IDS.settingsNukeConfirm} onClick={() => AreYouSureYouWantToNukeConfirmation()}>Yes! Nuke it all!</SettingButton>
            <SettingButton data-testid={TEST_IDS.settingsNukeCancel} onClick={() => ClosePopup()}>No! Abort!</SettingButton>
          </HorizontalItems>
        </div>
      ),
      title: "Are You Sure?",
    };
  };

  return (
    <div>
      <PageTitle>Settings</PageTitle>
      <MessageHeader bold>Backup &amp; Restore</MessageHeader>
      <SubMessage>Download your notes, import a backup, or restore an automatic backup.</SubMessage>
      <HorizontalItems>
        <SettingButton data-testid={TEST_IDS.settingsBackupRestore} onClick={() => chrome.runtime.openOptionsPage()}>Backup &amp; Restore</SettingButton>
      </HorizontalItems>
      <HorizontalItems>
        <SettingButton onClick={() => chrome.tabs.create({url : "/onboarding.html"}, () =>{ })}>Tutorial</SettingButton>
        <SettingButton onClick={() => chrome.tabs.create({url : "https://hibroseph.github.io/docamatic/contactus.html"}, () => {})}>Contact Us</SettingButton>
      </HorizontalItems>
      <MessageHeader bold>Privacy</MessageHeader>
      <SubMessage>
        <label>
          <input
            type="checkbox"
            data-testid={TEST_IDS.settingsAnalyticsToggle}
            checked={props.analyticsEnabled}
            onChange={(event) => props.setAnalyticsEnabled(event.target.checked)}
          />{" "}
          Share usage statistics (like how many notes are created). Never your notes or the sites you visit.
        </label>{" "}
        <a href="https://hibroseph.github.io/docamatic/privacy.html" target="_blank" rel="noopener noreferrer">Privacy policy</a>
      </SubMessage>
      <MessageHeader bold>Nuke</MessageHeader>
      <SubMessage>Deletes all notes. A backup is saved first, so this can be undone from Backup &amp; Restore.</SubMessage>
      <HorizontalItems>
        <SettingButton data-testid={TEST_IDS.settingsNuke} onClick={() => NukeNotes(props.nukeNotes)}>Nuke</SettingButton>
      </HorizontalItems>
      {showPopup && (
        <PopupWindow title={popupContent.title}>
          <PopupContent>{popupContent.jsx}</PopupContent>
        </PopupWindow>
      )}

      <p>Docamatic Version: {config.version}</p>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    analyticsEnabled: state.metadata?.analytics_enabled !== false,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    nukeNotes: () => {
      dispatch(nukeNotes());
    },
    setAnalyticsEnabled: (enabled) => {
      dispatch(setAnalyticsEnabled(enabled));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
