
import React from "react";
import {
  NoteContainer
} from "./style";
import { TitleBar } from "./TitleBar";
import { NoteBody } from "./NoteBody";
import { DraggableContainer } from "./DraggableContainer"

const Note = props => {
  return (
    <DraggableContainer {...props}>
      <NoteContainer color={{ ...props.color }}>
        <TitleBar {...props} />
        <NoteBody {...props} />
      </NoteContainer>
    </DraggableContainer>
  );
};

export default Note;