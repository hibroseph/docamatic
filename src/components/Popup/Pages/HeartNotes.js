import React, { Component } from "react";
import NoHeartNotes from "../../../assets/NoHeartNotes.png";
import FilterNotes from "./FilterNotes";
import { connect } from "react-redux";
import { PageTitle } from "../style"

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
    return (<div>
      <PageTitle>Favorite Notes</PageTitle>
      <FilterNotes
        filter={note => {
          return note.heart === true;
        }}
        noResultsImg={NoHeartNotes}
      ></FilterNotes>
    </div>
    );
  }
}

export default connect(
  state => {
    return { notes: state.pages };
  },
  null
)(HeartNotes);
