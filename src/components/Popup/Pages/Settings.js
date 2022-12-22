import React from "react";
import styled from "styled-components";
import { PageTitle } from "../style";
import config from "../../../../config.json";
import { MessageHeader, SubMessage } from "../Pages/CurrentPageNotes/style";
import { connect } from "react-redux";
import { importNotes, nukeNotes } from "../../../redux/actions";
import { saveAs } from "file-saver";
import PopupWindow from "../PopupWindow";
import { useState } from "react";

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

  /*
  const [showToast, setToastVisibility] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
*/
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

  const SaveNotesToFile = (notes) => {
    var blob = new Blob([JSON.stringify(notes)], { type: "application/json;charset=utf-8" });
    saveAs(blob, "docamatic-notes.json");
  };

  const OpenFile = (event, importNotes) => {
    /*
    setToastMessage("Importing Your Notes");
    setToastVisibility(true);
*/
    var input = event.target;

    var reader = new FileReader();

    reader.onload = function () {
      var notes = JSON.parse(reader.result);
      importNotes(notes, ClosePopup);
    };

    reader.readAsText(input.files[0]);
  };

  const OpenNotesToFile = () => {
    let fileElement = document.getElementById("inputFile");
    fileElement.click();
  };

  const GetNukeConfirmationPopup = () => {
    return {
      jsx: (
        <div>
          <SubMessage>This will delete all your notes. This is a non-reversible action!</SubMessage>
          <HorizontalItems>
            <SettingButton onClick={() => AreYouSureYouWantToNukeConfirmation()}>Yes! Nuke it all!</SettingButton>
            <SettingButton onClick={() => ClosePopup()}>No! Abort!</SettingButton>
          </HorizontalItems>
        </div>
      ),
      title: "Are You Sure?",
    };
  };

  return (
    <div>
      <PageTitle>Settings</PageTitle>
      <MessageHeader bold>Export/Import</MessageHeader>
      <HorizontalItems>
        <SettingButton onClick={() => SaveNotesToFile(props.notes)}>Export Notes</SettingButton>
        <SettingButton onClick={() => OpenNotesToFile()}>Import Notes</SettingButton>
        <input id="inputFile" hidden type="file" name="Import" onChange={(event) => OpenFile(event, props.importNotes)} />
      </HorizontalItems>
      <MessageHeader bold>Nuke</MessageHeader>
      <SubMessage>Warning! This will delete all notes. There is no recovery</SubMessage>
      <HorizontalItems>
        <SettingButton onClick={() => NukeNotes(props.nukeNotes)}>Nuke</SettingButton>
      </HorizontalItems>
      {showPopup && (
        <PopupWindow title={popupContent.title}>
          <PopupContent>{popupContent.jsx}</PopupContent>
        </PopupWindow>
      )}

      {/*showToast && <Toast message={toastMessage}></Toast>*/}
      <p>Docamatic Version: {config.version}</p>
    </div>
  );
};

const mapStateToProps = (state) => {
  return { notes: state.pages };
};

const mapDispatchToProps = (dispatch) => {
  return {
    importNotes: (notes, closePopup) => {
      dispatch(importNotes(notes, closePopup));
    },
    nukeNotes: () => {
      dispatch(nukeNotes());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
