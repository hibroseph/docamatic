import React from 'react'
import Note from './Note'
import { DraggableContainer } from './DraggableContainer'

export const DraggableNote = props => {

    return (
        <DraggableContainer key={props.id} {...props}>
            <Note key={props.id} {...props} />
        </DraggableContainer>
    )
}