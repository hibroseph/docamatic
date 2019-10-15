import React, { Component } from "react";
import CurrentlyBuilding from "../assets/CurrentlyBuilding.png";

class SortNotes extends Component {
  render() {
    return (
      <img
        style={{ marginLeft: 10, marginTop: 100 }}
        src={CurrentlyBuilding}
      ></img>
    );
  }
}

export default SortNotes;
