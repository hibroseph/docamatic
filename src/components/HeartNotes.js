import React, { Component } from "react";
import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import MiniSearchNote from "../components/MiniSearchNote";
import NoHeartNotes from "../assets/NoHeartNotes.png";
import FilterNotes from "./FilterNotes";
import { connect } from "react-redux";

// TODO: figure out state with the input
class HeartNotes extends Component {
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
    return (
      <FilterNotes
        filter={note => {
          return note.heart === true;
        }}
        noResultsImg={NoHeartNotes}
      ></FilterNotes>
    );
  }
}

export default connect(
  state => {
    return { state: state };
  },
  null
)(HeartNotes);
