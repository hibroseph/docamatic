import React from "react";
import { ColorSwatchContainer as Container } from "./ColorSwatchStyles";

const ColorSwatch = props => {
  return (
    <Container>
      {props.colors.map(color => {
        return (
          <div
            key={color}
            className="color"
            onClick={() => props.onColorChange(color)}
            style={{ backgroundColor: color }}
          ></div>
        );
      })}
    </Container>
  );
};

export default ColorSwatch;
