import React from "react";
import { BlockPicker } from "react-color";
import { getContrastingColor } from "../../../utils/ContrastingColor";
import { LightenColor } from "../../../utils/LightenColor";

import './ColorPicker.css';

const ColorPicker = props => {
  return (
    <div>
      {props.visible && (
        <BlockPicker
          color={props.color}
          className="color_picker"
          onChangeComplete={(color, event) => {
            // Calculate the contrasting color
            let contrastingColor = getContrastingColor(color);
            let accent = LightenColor(color.hex, -0.05)
            props.onColorChange(color.hex, contrastingColor, accent);
          }}
        />
      )}
    </div>
  );
};

export default ColorPicker;
