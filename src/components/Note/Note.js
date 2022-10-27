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
        onHeartifyClick={() => props.mutateNote({id: props.id, url: props.url, type: 'heartify'})}
        onDeleteClick={() => props.mutateNote({id: props.id, url: props.url, type: 'delete_note'})}
        onTitleChange={(event) => props.mutateNote({ id: props.id, title: event.target.value, url:props.url, type: 'title_change'})}
        onColorChange={(color) => props.mutateNote({id: props.id, color, url:props.url, type: 'color_change'})}
        onToggleVisibility={(visible) => props.mutateNote({id: props.id, url: props.url, visible, type:'toggle_visibility'})}
      />
      <div>
        {props?.tags?.map(tag => 
        <TagBubble key={tag.id} removeTag={() => props.mutateNote({id: props.id, url:props.url, tagId:tag.id, type: 'remove_tag'})} text={tag.text} color={tag.color}></TagBubble>
      )}
      <TagBubble
      color="#e0e0e0" 
      text="add tag" 
      contentEditable={true}
      createTag={tag => {
        console.log("creating tag in note"); 
        console.log(tag);
        props.mutateNote({ id: props.id, url:props.url, tag, type:'add_tag'})}}
      ></TagBubble></div>
      <NoteBody onBodyChange={(event) => props.mutateNote({id:props.id, body:event.target.value, url: props.url, type: 'body_change'})} {...props} />
    </NoteContainer>
  );
};

const mapDispatchToProps = (dispatch) => ({
  mutateNote: (props) => {
    console.debug("Mutating note with props:")
    console.debug(props)

    let action;

    switch (props.type) {
      case 'heartify':
         action = heartify(props.id, props.url);
         break;
      case 'delete_note':
        action = removeNote(props.id, props.url);
        break;
      case 'title_change':
        console.debug("setting title action")
        action = addTitle(props.id, props.title, props.url);
        break;
      case 'color_change':
        action = changeNoteColor(props.id, props.url, props.color);
        break;
      case 'toggle_visibility':
        action = toggleVisibility(props.id, props.url, props.visible);
        break;
      case 'remove_tag':
        action = removeTag(props.id, props.url, props.tagId);
        break;
      case 'add_tag':
        action = addTag(props.id, props.url, props.tag);
        break;
      case 'body_change':
        action = addText(props.id, props.body, props.url);
        break;
      default:
        console.error("Not handled with props");
        console.error(props);
      }
      console.debug("dispatching action")
      // call dispatch and handle promise once
      return dispatch(action)
      .then(() => console.debug("Successfully dispatched action: " + action.type))
      .catch(e => {
        // catch all errors and hopefully handle with retry
        // TODO: Create retry loop to only retry a few times and then error out

        console.debug("Attempting to wake service worker");
        chrome.runtime.connect({ name: "SCRIPT" }); 

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          console.debug("Recieved a message in note, maybe service worker?")
          console.debug(request);
          
          if (request.type === "STORE_INITIALIZED") {
            // Initializes the popup logic
            console.debug("Service worker responded and is awake")
            mapDispatchToProps(dispatch).mutateNote(props);
          } 
        });
      })
    
  
 } /*
  onHeartify: (id, url) => ,
  onStickify: (id, url) => dispatch(stickify(id, url)),
  onAddClick: (text, url) => dispatch(addNote(text, url)),
  onDeleteClick: (id, url) => dispatch(removeNote(id, url)),
  onTextChange: (id, text, url) => dispatch(addText(id, text, url)),
  onTitleChange: (id, text, url) => dispatch(addTitle(id, text, url)),
  onColorChange: (id, color, url) => dispatch(changeNoteColor(id, url, color)),
  onNoteClicked: (id, url) => dispatch(updateNoteDepth(id, url)),
  onToggleVisibility: (id, url, visible) => dispatch(toggleVisibility(id, url, visible)),
  removeTag: (noteId, url, tagId) => dispatch(removeTag(noteId, url, tagId)),
  addTag: (noteId, url, tagText) => dispatch(addTag(noteId, url, tagText))*/
});

export default connect(null, mapDispatchToProps)(Note);
