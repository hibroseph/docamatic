import React from "react";
import { ColorSwatchContainer as Container } from "./ColorSwatchStyles";
import { TEST_IDS } from "../../utils/testIds";

const ColorSwatch = props => {
  return (
    <Container>
      {props.colors.map(color => {
        return (
          <div
            key={color}
            className="color"
            data-testid={TEST_IDS.noteColor}
            data-color={color}
            onClick={() => props.onColorChange(color)}
            style={{ backgroundColor: color }}
          ></div>
        );
      })}
    </Container>
  );
};

export default ColorSwatch;
