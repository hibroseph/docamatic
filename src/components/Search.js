import React, { Component } from "react";
import { connect } from "react-redux";
import { SearchBarContainer } from "../elements/SearchBarContainer";

class Search extends Component {
  render(notes) {
    console.log("render in Search");

    console.log(notes);

    return (
      <SearchBarContainer>
        <input
          className="search_query_input"
          placeholder="Search Your Notes"
          onChange={event => this.props.onSearch(event.target.value)}
        />
      </SearchBarContainer>
    );
  }
}

function mapStateToProps(state) {
  return {
    notes: state.notes
  };
}
export default connect(mapStateToProps)(Search);
