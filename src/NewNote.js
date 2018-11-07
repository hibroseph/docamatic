import React from 'react'
import { connect } from 'react-redux'
import { addNote } from './actions'

// Generates a UUID
const getUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

const NewNote = ({ dispatch }) => {

    return (
        <div>
            <button type="submit" onClick={() => {
                dispatch(addNote("Hello New Note", "Note", getUUID()));
            }
            }>Add Note</button>

        </div>
    )
}

export default connect()(NewNote)
