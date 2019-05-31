import React from "react"
import './NoteBody.css'

const NoteBody = (props) => {
    console.log("Props in NoteBody");
    console.log(props)

    return (
        <textarea
              className="note-input"
              onClick={props.updateFocus}
              onChange={props.onTextChange}
              defaultValue={props.defaultValue}
            />
    )
}

export default NoteBody;