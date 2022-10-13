import React from 'react'
import Note from './Note'
import { DraggableContainer } from './DraggableContainer'

export const DraggableNote = props => {

    return (
        <DraggableContainer {...props}>
            <Note {...props} />
        </DraggableContainer>
    )
}