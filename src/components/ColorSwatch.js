import React, { Component } from "react";
import { ColorSwatchContainer as Container } from "../styles/ColorSwatchStyles";

class ColorSwatch extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Container onMouseLeave={this.props.onMouseLeave}>
        {this.props.colors.map(color => {
          return (
            <div
              key={color}
              className="color"
              onClick={() => this.props.onColorChange(color)}
              style={{ backgroundColor: color }}
            ></div>
          );
        })}
      </Container>
    );
  }
}

export default ColorSwatch;
