import React from 'react'
import { connect } from 'react-redux'
import { addNote } from './actions'

const NewNote = ({ dispatch }) => {
    return (
        <div>
            <button type="submit" onClick={() => {
                dispatch(addNote("Hello New Note"));
                // console.log(store.getState())
            }
            }>Add Notey</button>
        </div>
    )
}

export default connect()(NewNote)
