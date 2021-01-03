import React from 'react'
import { Rnd } from "react-rnd";
export const DraggableContainer = props => {
    const RndConfiguration = () => {
        return {
            default:
            {
                x: props.position.x,
                y: props.position.y,

                width: props.size.width,
                height: props.size.height
            }
            ,
            onDragStop: (e, d) => {
                props.onPositionChange(props.id, d.x, d.y);
            },
            onResizeStop: (e, d, ref, delta, position) => {
                props.onSizeChange(
                    props.size.width + delta.width,
                    props.size.height + delta.height
                );
            },
            dragHandleClassName: "drag-handle",
            minWidth: 200,
            minHeight: 200,
            bounds: "window",
            enableResizing: {
                top: false,
                left: false,
                right: true,
                bottom: true,
                topRight: false,
                topLeft: false,
                bottomRight: true,
                bottomLeft: false
            },
            disableDragging: props.stickify ? true : false,
            style: {
                position: props.stickify ? "fixed" : "absolute"

            }
        }
    }

    return (
        <Rnd {...RndConfiguration()}>
            {props.children}
        </Rnd>)
}
