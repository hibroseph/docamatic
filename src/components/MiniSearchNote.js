import React, { Component } from "react";
import { MiniSearchNoteContainer } from "../elements/MiniSearchNoteContainer";
import { CreateFriendlyPreviewUrl } from "../utils/CreateFriendlyPreviewUrl"
class MiniSearchNote extends Component {
  render() {
    // Two arrays to construct the bolded queries
    // let bodyBoldedSearchQuery = [];
    // let titleBoldedSearchQuery = [];

    // let i = 0;

    // // To bold the search query in the title
    // for (i; i < this.props.titleSplitAtQueryText.length; i++) {
    //   titleBoldedSearchQuery.push(
    //     <span>{this.props.titleSplitAtQueryText[i]}</span>
    //   );

    //   // Check to add only 1 search query NOT at the end
    //   if (i < this.props.titleSplitAtQueryText.length - 1) {
    //     titleBoldedSearchQuery.push(<b>{this.props.searchQuery}</b>);
    //   }
    // }

    // i = 0;

    // // To bold the search query in the body
    // for (i; i < this.props.bodySplitAtQueryText.length; i++) {
    //   bodyBoldedSearchQuery.push(
    //     <span>{this.props.bodySplitAtQueryText[i]}</span>
    //   );
    //   //   Ledt's make sure the last search Query doesn't appear
    //   if (i < this.props.bodySplitAtQueryText.length - 1) {
    //     bodyBoldedSearchQuery.push(<b>{this.props.searchQuery}</b>);
    //   }
    // }

    return (
      <MiniSearchNoteContainer
        color={this.props.color}
        onClick={() => {
          window.open(this.props.website, "_blank");
        }}
      >
        {this.props.showUrlPreview != null &&
          <p className="url-preview">{this.props.previewText}</p>
        }
        <div className="note">
          <div className="title-bar">
            <div> {this.props.title} </div>
          </div>

          <div className="body">
            <div>{this.props.body}</div>
          </div>
        </div>
      </MiniSearchNoteContainer>
    );
  }
}

export default MiniSearchNote;
