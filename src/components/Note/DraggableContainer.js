import React from "react";
import { Rnd } from "react-rnd";
export const DraggableContainer = (props) => {
  const RndConfiguration = () => {
    return {
      onDragStop: (e, d) => {
        try {
          props.onPositionChange(props.id, d.x, d.y);
        } catch(error) {
          console.error("Unable to update note position")
        }
      },
      onResizeStop: (e, d, ref, delta, position) => {
        try {
          props.onSizeChange(props.size.width + delta.width);
        } catch(error) {
          console.error("Unable to update note size")
        }
      },
      dragHandleClassName: "drag-handle",
      bounds: "window",
      enableResizing: {
        top: false,
        left: false,
        right: true,
        bottom: false,
        topRight: false,
        topLeft: false,
        bottomRight: false,
        bottomLeft: false,
      },
      disableDragging: props.stickify ? true : false,
      style: {
        position: props.stickify ? "fixed" : "absolute",
        ...props.style
      },
    };
  };

  let isOffScreen = props.position.x + props.size.width > props.windowWidth - 17;

  if (isOffScreen) {
    console.log("note with id " + props.id + " is off screen!")

    console.log("note x position: " + (props.windowWidth - props.size.width))
  }

  return <Rnd 
    position={{
      x: isOffScreen ? (props.windowWidth - props.size.width - 17)  : props.position.x,
      y: props.position.y
    }}
    size={{
      width: props.size.width
    }}
    {...RndConfiguration()} 
    id={props.id}>{props.children}</Rnd>;
};
