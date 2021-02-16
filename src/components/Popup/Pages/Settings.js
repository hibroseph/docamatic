import React from "react";
import styled from "styled-components";
import { PageTitle } from "../style";
import { VERSION } from "../../../utils/constants";
import { MessageHeader, SubMessage } from "../Pages/CurrentPageNotes/style";
import { connect } from "react-redux";
import { importNotes } from "../../../redux/actions";

const SettingButton = styled.button``;
const VerticalButtons = styled.div`
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;
const HorizontalItems = styled.div`
display flex; 
justify-content: space-between;
align-items: center;`;

const SaveNotesToFile = (notes) => {
  console.log("Saving notes to file");
  var blob = new Blob([JSON.stringify(notes)], { type: "application/json;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var element = document.createElement("a");
  element.href = url;
  element.download = "notes.json";
  document.body.append(element);
  element.click();
  console.log("Finished saving notes to a file");
};

const OpenFile = (event, importNotes) => {
  console.log("opening file");
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

const Settings = (props) => {
  console.log(props);
  return (
    <div>
      <PageTitle>Settings</PageTitle>
      <MessageHeader bold>Export/Import</MessageHeader>
      <SubMessage>
        The following is used to export your notes to a file and import them. This might be necessary if you install another version of chrome. It is
        also recommend to make file backup of your notes if they are important incase of data corruption or accidental deletion of the app
      </SubMessage>
      <VerticalButtons>
        <SettingButton onClick={() => SaveNotesToFile(props.notes)}>Export Notes</SettingButton>
        <HorizontalItems>
          <p>Import</p>
          <input type="file" name="Import" onChange={(event) => OpenFile(event, props.importNotes)} />
        </HorizontalItems>
      </VerticalButtons>
      <p>Version: {VERSION}</p>
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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
