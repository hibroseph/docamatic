import React, { Component } from "react";
import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";

class SearchNotes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search_query: null
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({ search_query: event.target.value });
  }

  render() {
    console.log("PROPS");
    console.log(this.props);
    return (
      <Container>
        <input
          value={this.state.search_query}
          className="searchbox"
          placeholder="Search Notes Here"
          onChange={this.handleChange}
        ></input>
        <div className="searchresults">
          {Object.keys(this.props.notes).map(key => {
            // console.log(key);
            return this.props.state[key].notes.map(note => {
              if (this.state.search_query != null) {
                if (
                  note.body.includes(this.state.search_query) ||
                  note.title.includes(this.state.search_query)
                ) {
                  // foundItem = true;
                  // Split the text to bold the part that is the search query
                  let title = note.title.split(this.state.search_query);
                  let text = note.body.split(this.state.search_query);

                  return (
                    <MiniSearchNote
                      {...note}
                      bodySplitAtQueryText={text}
                      titleSplitAtQueryText={title}
                      searchQuery={this.state.search_query}
                      website={key}
                    />
                  );
                }
              }
            });
          })}
        </div>
      </Container>
    );
  }
}

export default connect(
  state => {
    return { notes: state };
  },
  null
)(SearchNotes);
