import React from "react";
import styled from "styled-components";
import { PageTitle } from "../style";
import { VERSION } from "../../../utils/constants";
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

const SaveNotesToFile = (notes) => {
  var blob = new Blob([JSON.stringify(notes)], { type: "application/json;charset=utf-8" });
  saveAs(blob, "docamatic-notes.json");
};

const OpenFile = (event, importNotes) => {
  console.log(event);
  var input = event.target;

  var reader = new FileReader();

  reader.onload = function () {
    var notes = JSON.parse(reader.result);
    console.log(notes);
    importNotes(notes);
  };

  reader.readAsText(input.files[0]);
};

const OpenNotesToFile = () => {
  let fileElement = document.getElementById("inputFile");
  fileElement.click();
};

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
        <div style={{ padding: "10px" }}>
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
      {showPopup && <PopupWindow title={popupContent.title}>{popupContent.jsx}</PopupWindow>}
      <p>Docamatic Version: {VERSION}</p>
    </div>
  );
};

const mapStateToProps = (state) => {
  return { notes: state };
};

const mapDispatchToProps = (dispatch) => {
  return {
    importNotes: (notes) => {
      dispatch(importNotes(notes));
    },
    nukeNotes: () => {
      dispatch(nukeNotes());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
