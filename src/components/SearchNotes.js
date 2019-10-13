import React, { Component } from "react";
import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";
import search_hint from "../assets/search_results.png";
import no_results from "../assets/no_results.png";

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

    let foundItem = false;
    return (
      <Container>
        <input
          value={this.state.search_query}
          className="searchbox"
          placeholder="Search Notes Here"
          onChange={this.handleChange}
        ></input>
        <div className="searchresults">
          {!this.state.search_query && (
            <img src={search_hint} style={{ marginLeft: 10 }}></img>
          )}
          {this.state.search_query &&
            Object.keys(this.props.notes).map(key => {
              return this.props.state[key].notes.map(note => {
                if (this.state.search_query != null) {
                  if (
                    note.body
                      .toLowerCase()
                      .includes(this.state.search_query.toLowerCase()) ||
                    note.title
                      .toLowerCase()
                      .includes(this.state.search_query.toLowerCase())
                  ) {
                    foundItem = true;
                    // Split the text to bold the part that is the search query
                    // let title = note.title.split(this.state.search_query);
                    // let text = note.body.split(this.state.search_query);

                    return (
                      <MiniSearchNote
                        {...note}
                        // bodySplitAtQueryText={text}
                        // titleSplitAtQueryText={title}
                        searchQuery={this.state.search_query}
                        website={key}
                      />
                    );
                  }
                }
              });
            })}
          {this.state.search_query && !foundItem && (
            <img style={{ marginLeft: 10 }} src={no_results}></img>
          )}
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
