import React, { Component } from "react";
import { SearchBox } from "../SearchNotesStyle";
import { connect } from "react-redux";
import search_hint from "../../../assets/search_results.png";
import no_results from "../../../assets/no_results.png";
import FilterNotes from "./FilterNotes";

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

  // TODO: Figure out how to render no search results image if the filter notes component returns null
  render() {
    let foundItem = false;
    return (
      <div>
        <SearchBox>
          <input
            // value={this.state.search_query}
            placeholder="Search"
            onChange={this.handleChange}
          ></input>
        </SearchBox>
        {!this.state.search_query && (
          <img
            src={search_hint}
            style={{ marginLeft: 10, marginTop: 100 }}
          ></img>
        )}
        <FilterNotes
          filter={note => {
            // The searching lambda
            if (this.state.search_query) {
              return (
                (note.title != null &&
                note.title
                  .toLowerCase()
                  .includes(this.state.search_query.toLowerCase())) ||
                (note.body != null && note.body
                  .toLowerCase()
                  .includes(this.state.search_query.toLowerCase()))
                  
              );
            }
          }}
          noResultsImg={this.state.search_query ? no_results : null}
        />
      </div>
    );
  }
}

export default connect(
  state => {
    return { notes: state.pages };
  },
  null
)(SearchNotes);
