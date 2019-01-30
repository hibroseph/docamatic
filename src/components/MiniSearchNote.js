import React, { Component } from "react";
import { MiniSearchNoteContainer } from "../elements/MiniSearchNoteContainer";

class MiniSearchNote extends Component {
  render() {
    let boldedSearchQuery = [];

    let i = 0;

    for (i; i < this.props.splitAtQueryText.length; i++) {
      console.log("<span> [i]" + this.props.splitAtQueryText[i]);
      boldedSearchQuery.push(<span>{this.props.splitAtQueryText[i]}</span>);
      console.log("<span>" + this.props.searchQuery);

      //   Ledt's make sure the last search Query doesn't appear
      if (i < this.props.splitAtQueryText.length - 1) {
        boldedSearchQuery.push(<b>{this.props.searchQuery}</b>);
      }
    }

    return (
      <MiniSearchNoteContainer
        style={{
          backgroundColor: this.props.color
        }}
        onClick={() => {
          window.open(this.props.website, "_blank");
        }}
      >
        <div className="title-bar">
          <div> {this.props.title} </div>
        </div>

        <div className="body">{boldedSearchQuery}</div>

      </MiniSearchNoteContainer>
    );
  }
}

export default MiniSearchNote;
