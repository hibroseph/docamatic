import React, { Component } from "react";
import { connect } from "react-redux";

class Search extends Component {

  render(notes) {
    console.log("render in Search")

    console.log(notes);

    return (
      <div className="search_bar">
        <input className="search_query_input" placeholder="Search Your Notes" onChange={event => this.props.onSearch(event.target.value)}></input>
      
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    notes: state.notes
  };
}
export default connect(mapStateToProps)(Search);
