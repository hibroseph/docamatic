import React, { Component } from "react";
// import clickdrag from "react-clickdrag";
import { NoteContainer } from "../elements/NoteContainer";
import { Icon } from "antd";
import { BlockPicker } from "react-color";
import { Rnd } from "react-rnd";

class Note extends Component {
  constructor(props) {
    super(props);

    this.sizeOfComponent = React.createRef();

    // console.log("Color of note: " + this.props.color);
    // Using a local state to assist in moving dem
    this.state = {
      currentX: this.props.position.x,
      currentY: this.props.position.y,
      lastPositionX: 0,
      lastPositionY: 0,
      colorPickerVisible: false,
      width: this.props.size.width,
      height: this.props.size.height,
      ContrastingColor: this.props.contrastColor
    };
  }


  render() {
    return (
      <Rnd
        default={{
          x: this.state.currentX,
          y: this.state.currentY,
          width: this.state.width,
          height: this.state.height
        }}
        onDragStop={(e, d) => {
          console.log("x: " + d.x + " y: " + d.y);
          this.setState({
            currentX: d.x,
            currentY: d.y
          });

          this.props.onPositionChange(this.props.id, d.x, d.y);
        }}
        onResizeStop={(e, d, ref, delta, position) => {
          let tempWidth = this.state.width + delta.width;
          let tempHeight = this.state.height + delta.height;

          console.log(
            "updating size width: " + tempWidth + " height: " + tempHeight
          );

          this.setState({
            width: tempWidth,
            height: tempHeight
          });

          this.props.onSizeChange(tempWidth, tempHeight);
        }}
        minWidth={200}
        minHeight={200}
        bounds="window"
      >
        <NoteContainer>
          <div className="note" ref={this.sizeOfComponent}>
            <div
              className="title-bar"
              style={{ backgroundColor: this.props.color }}
            >
              <input
                className="title-input"
                placeholder="Note"
                defaultValue={this.props.title}
                style={{ color: this.state.ContrastingColor }}
                onClick={() => {
                  this.setState({
                    colorPickerVisible: false
                  });
                }}
                onChange={this.props.onTitleChange}
                onMouseDown={e => {
                  e.stopPropagation();
                }}
              />

              <Icon
                type="bg-colors"
                className="nav-bar-item-color"
                style={{ color: this.state.ContrastingColor }}
                onClick={() => {
                  this.setState({
                    colorPickerVisible: true
                  });
                }}
              />

              <Icon
                className="nav-bar-item-delete"
                style={{ color: this.state.ContrastingColor }}
                type="delete"
                onClick={this.props.onDeleteClick}
              />
            </div>

            <textarea
              className="note-input"
              onClick={() => {
                this.setState({
                  colorPickerVisible: false
                });
              }}
              onMouseDown={e => {
                e.stopPropagation();
              }}
              onDoubleClick={() => {
                // console.log("you clicked twice nigga!");
              }}
              onChange={this.props.onBodyChange}
              defaultValue={this.props.body}
            />
            {this.state.colorPickerVisible && (
              <BlockPicker
                className="color-picker"
                color={this.props.color}
                onChangeComplete={(color, event) => {
                  // Calculate contrasting color
                  // Thanks goes to casesandberg on github for this formula from the heavens
                  const yiq =
                    (color.rgb.r * 299 +
                      color.rgb.g * 587 +
                      color.rgb.b * 114) /
                    1000;
                  const CC = yiq >= 128 ? "#000" : "#fff";
                  this.props.onColorChange(color.hex, CC);

                  this.setState({
                    ContrastingColor: CC
                  });
                }}
              />
            )}
          </div>
        </NoteContainer>
      </Rnd>
    );
  }
}

export default Note;
