import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { PENDING_TIMEOUT_MS } from "../../utils/useStoreSyncedText";

// Room for the page's vertical scrollbar
const SCROLLBAR_WIDTH = 17;

export const DraggableContainer = (props) => {
  // Rnd only shows the position/size it is given. The saved position comes
  // back from the background store a moment after a drag ends, so without
  // this the note would snap back to its old spot until then. The dropped
  // position is used until the store has caught up with it (or it's been a
  // while, so a move made in another tab still comes through). Same idea as
  // useStoreSyncedText for typing.
  const [dropped, setDropped] = useState(null); // { x, y, at }
  const [resized, setResized] = useState(null); // { width, at }

  useEffect(() => {
    if (!dropped) return;
    const caughtUp = props.position.x === dropped.x && props.position.y === dropped.y;
    if (caughtUp || Date.now() - dropped.at > PENDING_TIMEOUT_MS) setDropped(null);
  }, [props.position.x, props.position.y]);

  useEffect(() => {
    if (!resized) return;
    if (props.size.width === resized.width || Date.now() - resized.at > PENDING_TIMEOUT_MS) setResized(null);
  }, [props.size.width]);

  const position = dropped || props.position;
  const width = resized ? resized.width : props.size.width;

  const RndConfiguration = () => {
    return {
      onDragStop: (e, d) => {
        // A click on the drag handle without moving: nothing to save
        if (d.x === position.x && d.y === position.y) return;
        setDropped({ x: d.x, y: d.y, at: Date.now() });
        try {
          props.onPositionChange(props.id, d.x, d.y);
        } catch(error) {
          console.error("Unable to update note position")
        }
      },
      onResizeStop: (e, d, ref, delta, position) => {
        if (delta.width === 0) return;
        const newWidth = width + delta.width;
        setResized({ width: newWidth, at: Date.now() });
        try {
          props.onSizeChange(newWidth);
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

  // Keep notes saved on a wider window from ending up off screen
  let isOffScreen = position.x + width > props.windowWidth - SCROLLBAR_WIDTH;

  return <Rnd
    position={{
      x: isOffScreen ? (props.windowWidth - width - SCROLLBAR_WIDTH)  : position.x,
      y: position.y
    }}
    size={{
      width
    }}
    {...RndConfiguration()}
    id={props.id}>{props.children}</Rnd>;
};
