import React, { Component } from "react";
import { LightenColor } from "../utils/LightenColor";
import { NoteContainer } from "../elements/NoteContainer";
import { Icon } from "antd";
import { Rnd } from "react-rnd";
import ColorPicker from "./Note/ColorPicker/ColorPicker";
import NoteBody from "./Note/NoteBody/NoteBody";
import NoteTitle from "./Note/NoteTitle/NoteTitle";

class Note extends Component {
  constructor(props) {
    super(props);

    this.sizeOfComponent = React.createRef();
    let accent = LightenColor(this.props.color, -0.05);

    console.log("Your accent color is: " + accent);

    this.state = {
      currentX: this.props.position.x,
      currentY: this.props.position.y,
      lastPositionX: 0,
      lastPositionY: 0,
      colorPickerVisible: false,
      width: this.props.size.width,
      height: this.props.size.height,
      ContrastingColor: this.props.contrastColor,
      AccentColor: accent
    };

    // Bind dem
    this.focus = this.focus.bind(this);
  }

  // To find what to display
  focus(item) {
    console.log("Deciding on what to focus on");

    switch (item) {
      case "color":
        this.setState({
          colorPickerVisible: true
        });
        break;
      case "note":
        this.setState({
          colorPickerVisible: false
        });
        break;
      default:
        this.setState({
          colorPickerVisible: false
        });
        break;
    }
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
          let tempHeight = this.state.height + delta.height + 20;

          this.setState({
            width: tempWidth,
            height: tempHeight
          });

          this.props.onSizeChange(tempWidth, tempHeight);
        }}
        dragHandleClassName="note-drag-handle"
        minWidth={200}
        minHeight={200}
        bounds="window"
      >
        <NoteContainer>
          <div
            className="note"
            ref={this.sizeOfComponent}
            onClick={() => {
              this.props.onNoteClicked(this.props.id);
            }}
          >
            <NoteTitle
              accentColor={this.state.AccentColor}
              textColor={this.state.ContrastingColor}
              color={this.props.color}
              title={this.props.title}
              updateFocus={this.focus}
              onChange={this.props.onTitleChange}
              onDeleteClick={this.props.onDeleteClick}
            />
            <NoteBody
              onTextChange={this.props.onBodyChange}
              defaultValue={this.props.body}
              updateFocus={this.focus}
            />

            <ColorPicker
              color={this.props.color}
              visible={this.state.colorPickerVisible}
              onColorChange={(color, contrast, accent) => {
                this.setState({
                  ContrastingColor: contrast,
                  AccentColor: accent
                });
                this.props.onColorChange(color, contrast);
              }}
            />
          </div>
        </NoteContainer>
      </Rnd>
    );
  }
}

export default Note;
