import React, { Component } from "react";
import CurrentlyBuilding from "../assets/CurrentlyBuilding.png";
import { connect } from "react-redux";
import { SortNotesFactory } from "../utils/SortNotes";
// import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import { FilterNotes as Container } from "../styles/FilterNotesStyle";
import MiniSearchNote from "../components/MiniSearchNote";
import FilterNotes from "../components/FilterNotes";

class SortNotes extends Component {
  render() {
    // SortNotesFactory(this.props.state);
    return (
      <Container>
        <FilterNotes filter={note => {
          return true;
        }}>

        </FilterNotes>
      </Container>
    );
  }
}

export default connect(
  state => {
    return { state: state };
  },
  null
)(SortNotes);
