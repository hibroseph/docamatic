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
        props.onPositionChange(props.id, d.x, d.y);
      },
      onResizeStop: (e, d, ref, delta, position) => {
        props.onSizeChange(props.size.width + delta.width);
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
      },
    };
  };

  return <Rnd {...RndConfiguration()}>{props.children}</Rnd>;
};
