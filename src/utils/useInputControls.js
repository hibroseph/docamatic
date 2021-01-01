import React, { useEffect, useState, useRef } from "react";

export const useInputControls = () => {
    /*
      there currently is a glitch in the space time when you move a card. I think it has to do with the props
      not getting set fast enough so the note glitches back since we are setting the current position to be the y position
    */
    const [noteBodyCursorPosition, setNoteBodyCursorPosition] = useState(0);
    const [noteTitleCursorPosition, setNoteTitleCursorPosition] = useState(0);

    /* Using controlled inputs (the title input and body textarea requires us to 
      manually manipulate where the cursor is pointing at
      */
    const textAreaRef = useRef(null);
    const titleRef = useRef(null);

    useEffect(() => {
        textAreaRef.current.selectionStart = noteBodyCursorPosition;
        textAreaRef.current.selectionEnd = noteBodyCursorPosition;

        titleRef.current.selectionStart = noteTitleCursorPosition;
        titleRef.current.selectionEnd = noteTitleCursorPosition;
    })

    return {
        title:
        {
            ref: titleRef,
            setCursorPosition: setNoteTitleCursorPosition
        },
        body:
        {
            ref: textAreaRef,
            setCursorPosition: setNoteBodyCursorPosition
        }
    }
}