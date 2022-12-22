import React, { Component } from "react";
import Note from "../../Note/Note";
import { NotePadding } from "../style";
import { connect } from "react-redux";
import { CreateFriendlyPreviewUrl } from "../../../utils/CreateFriendlyPreviewUrl";
import { PreviewUrl } from "../style";
import { NoRenderErrorBoundary } from "../../NoRenderErrorBoundary"
class FilterNotes extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let foundItem = false;
    const element = Object.keys(this.props.notes).map((key) => {
      if (key != 'tags') {
        return (
          <div key={key}>
            {this.props.labels && <div className="label">{key} </div>}
            {this.props.notes[key].notes.map((note) => {
              // Comparing happens right here
              if (this.props.filter(note)) {
                foundItem = true;
                return (
                  <NoRenderErrorBoundary key={note.id}>
                    <NotePadding>
                      <PreviewUrl href={key} target="_new">
                        {CreateFriendlyPreviewUrl(key)}
                      </PreviewUrl>
                      <Note
                      {...note} 
                      tags={this.props.tags.filter(tag => tag.notes.includes(note.id))}
                      popup={true}
                      key={note.id}
                      url={key} 
                      disableClick={true}/>
                    </NotePadding>
                  </NoRenderErrorBoundary>
                );
              }
            })}
          </div>
        );  
          }
    });

    if (foundItem) {
      return <div className={this.props.style ? this.props.style : "filter-results"}>{element}</div>;
    } else {
      return <img style={{ marginTop: 100, marginLeft: 10 }} src={this.props.noResultsImg}></img>;
    }
  }
}

export default connect((state) => {
  return { 
    notes: state.pages,
    tags: state.tags || [] };
}, null)(FilterNotes);
