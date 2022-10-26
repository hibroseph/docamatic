import React from "react";
import { NoteContainer } from "./style";
import { TitleBar } from "./TitleBar";
import { NoteBody } from "./NoteBody";
import { connect } from "react-redux";
import { addNote, removeNote, addText, addTitle, changeNoteColor, updateNoteDepth, stickify, heartify, toggleVisibility, removeTag, addTag } from "../../redux/actions";
import { TagBubble } from "../TagBubble";
export const Note = (props) => {
  console.log("props in note")
  console.log(props)
  return (
  
    <NoteContainer color={{ ...props.color }}>
      <TitleBar
        {...props}
        onHeartifyClick={() => props.onHeartify(props.id, props.url)}
        onDeleteClick={() => props.onDeleteClick(props.id, props.url)}
        onTitleChange={(event) => props.onTitleChange(props.id, event.target.value, props.url)}
        onColorChange={(color) => props.onColorChange(props.id, color, props.url)}
        onToggleVisibility={(visible) => props.onToggleVisibility(props.id, props.url, visible)}
      />
      <div>
        {props?.tags?.map(tag => 
        <TagBubble key={tag.id} removeTag={() => props.removeTag(props.id, props.url, tag.id)} text={tag.text} color={tag.color}></TagBubble>
      )}
      <TagBubble
      color="#e0e0e0" 
      text="add tag" 
      contentEditable={true}
      createTag={tag => {
        console.log("creating tag in note"); 
        console.log(tag);
        props.addTag(props.id, props.url, tag)}}
      ></TagBubble></div>
      
      <NoteBody onBodyChange={(event) => props.onTextChange(props.id, event.target.value, props.url)} {...props} />
    </NoteContainer>
  );
};

const mapDispatchToProps = (dispatch) => ({
  onHeartify: (id, url) => dispatch(heartify(id, url)),
  onStickify: (id, url) => dispatch(stickify(id, url)),
  onAddClick: (text, url) => dispatch(addNote(text, url)),
  onDeleteClick: (id, url) => dispatch(removeNote(id, url)),
  onTextChange: (id, text, url) => dispatch(addText(id, text, url)),
  onTitleChange: (id, text, url) => dispatch(addTitle(id, text, url)),
  onColorChange: (id, color, url) => dispatch(changeNoteColor(id, url, color)),
  onNoteClicked: (id, url) => dispatch(updateNoteDepth(id, url)),
  onToggleVisibility: (id, url, visible) => dispatch(toggleVisibility(id, url, visible)),
  removeTag: (noteId, url, tagId) => dispatch(removeTag(noteId, url, tagId)),
  addTag: (noteId, url, tagText) => dispatch(addTag(noteId, url, tagText))
});

export default connect(null, mapDispatchToProps)(Note);
