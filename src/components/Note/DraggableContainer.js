import React from "react";
import { Rnd } from "react-rnd";
export const DraggableContainer = (props) => {
  const RndConfiguration = () => {
    return {
      default: {
        x: props.position.x,
        y: props.position.y,

        width: props.size.width,
      },
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

  return <Rnd {...RndConfiguration()} id={props.idd}>{props.children}</Rnd>;
};
