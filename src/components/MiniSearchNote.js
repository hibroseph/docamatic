import React, { Component } from "react";
import { MiniSearchNoteContainer } from "../elements/MiniSearchNoteContainer";

class MiniSearchNote extends Component {
  render() {
    console.log("MiniSearchNote body " + this.props.body);
    console.log("MiniSearchNote title " + this.props.title);

    console.log("this.props.searchQuery:" + this.props.searchQuery);
    console.log("this.props.text[0]:" + this.props.text[0]);
    console.log("this.props.text[1]:" + this.props.text[1]);

    console.log("this.props.text:");
    console.log(this.props.text);

    let boldedSearchQuery = [];

    let i = 0;

    for (i; i < this.props.text.length; i++) {
      console.log("<span> [i]" + this.props.text[i]);
      boldedSearchQuery.push(<span>{this.props.text[i]}</span>);
      console.log("<span>" + this.props.searchQuery);
      if (i < (this.props.text.length - 1)) {
        boldedSearchQuery.push(<b>{this.props.searchQuery}</b>);
      }
      //   console.log("<span> [i+1]" + this.props.text[i+1])
      //   boldedSearchQuery.push(<span>{this.props.text[i + 1]}</span>);
    }

    console.log("boldedSearchQuery");
    console.log(boldedSearchQuery);

    return (
      <MiniSearchNoteContainer>
        <div className="title_bar">
          <div> {this.props.title} </div>
        </div>

        <div className="body">
          {/* <div>
            {this.props.text[0]}
            <span style={{ fontWeight: "bold" }}>
              {this.props.searchQuery}
            </span>
            {this.props.text[1]}    
          </div> */}
          {boldedSearchQuery}
        </div>
      </MiniSearchNoteContainer>
    );
  }
}

export default MiniSearchNote;
