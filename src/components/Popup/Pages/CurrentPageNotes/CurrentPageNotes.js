import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { NotValidWebpage, MessageHeader, SubMessage, NoteList, CreateNewNote, Image, Link } from "./style";
import { NotePadding, PageTitle } from "../../style";
import WomanLookingAtWebPageImage from "../../../../assets/woman-looking-at-webpage.png";
import ManPostingNote from "../../../../assets/man-posting-note.png";
import Note from "../../../Note/Note";
import { COLORS } from "../../../../utils/constants";
import { GetSafeNoteUrl } from "../../../../utils/GetSafeNoteUrl";

const CurrentPageNotes = (props) => {
  const [url, setCurrentUrl] = useState("");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let url = tabs[0].url;
      setCurrentUrl(GetSafeNoteUrl(url));
    });
  }, []);

  const NotValidPage = () => {
    return (
      <NotValidWebpage>
        <img style={{ width: "300px", height: "auto", objectFit: "cover" }} src={WomanLookingAtWebPageImage}></img>
        <MessageHeader bold>We can't place a note on this page. </MessageHeader>
        <SubMessage>
          Go to any webpage to add a note such as{" "}
          <Link href="https://google.com" target="_blank">
            google.com
          </Link>
        </SubMessage>
      </NotValidWebpage>
    );
  };

  const RenderNoValidNote = () => {
    if ((!Object.keys(props.notes).includes(url) || props.notes[url].notes.length == 0) && IsValidUrl()) {
      return (
        <CreateNewNote>
          <MessageHeader bold>There are no notes on this page. </MessageHeader>
          <Image src={ManPostingNote}></Image>
          <button onClick={props.createNewNote}>Create New Note</button>
        </CreateNewNote>
      );
    }
  };
  const IsValidUrl = () => {
    return !(url == "" || url == null || url == undefined || !url.match(/https?/));
  };

  return (
    <NoteList>
      <PageTitle>Current Notes on Page</PageTitle>
      {!IsValidUrl(url) && NotValidPage()}
      {IsValidUrl(url) &&
        Object.keys(props.notes).map((key) => {
          if (key == url) {
            return props.notes[key].notes.map((note) => {
              return (
                <NotePadding key={note.id}>
                  <Note popup={true} 
                  {...note} 
                  tags={props.tags.filter(tag => tag.notes.includes(note.id))}
                  colors={props.colors} url={key} />
                </NotePadding>
              );
            });
          }
        })}
      {RenderNoValidNote()}
    </NoteList>
  );
};

const mapStateToProps = (state) => {
  return { 
    notes: state,
    tags: state.tags || [],
    colors: COLORS };
};

export default connect(mapStateToProps, null)(CurrentPageNotes);
