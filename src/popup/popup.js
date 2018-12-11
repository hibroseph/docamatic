import React, { Component } from "react";
import NewNote from '../components/NewNote'
import Search from '../components/Search'

class Popup extends Component {
  render() {
    return (
      <div style={{width: 200, height: 200}}>
        <NewNote></NewNote>
        <Search></Search>
      </div>
    );
  }
}

export default Popup;
