import React, { Component } from "react";
import { PopupStyle as Container } from "../styles/PopupStyle";
import { PopupContent } from "../components/PopupContent";
import { IconList } from "../components/IconList";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import {
  faStickyNote,
  faSearch,
  faHeart,
  faCog,
  faBell,
  faSortAmountDown
} from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";

// The list of icons to generate in the side bar
const icons = [
  { type: faStickyNote, name: "new" },
  { type: faSearch, name: "search" },
  { type: faHeart, name: "hearted" }
  // { type: faSortAmountDown, name: "sort" },
  // { type: faBell, name: "alerts" },
  // { type: faCog, name: "settings" }
];

export class Popup extends Component {
  constructor(props) {
    super(props);
    this.state = { page: "welcome" };

    this.DetermineClick = this.DetermineClick.bind(this);
  }

  DetermineClick(data) {
    if (data === "new") {
      data = "Note";
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        // eslint-disable-next-line no-undef
        chrome.tabs.sendMessage(tabs[0].id, { newNote: "" }, response => {
          try {
            this.props.addNoteClick(data, response);
          } catch (err) {
          }
        });
      });
    } else {
      this.setState({
        page: data
      });
    }
  }

  render() {
    return (
      <Container>
        <IconList
          icons={icons}
          onClicky={data => this.DetermineClick(data)}
        ></IconList>
        <PopupContent
          state={this.props.state}
          page={this.state.page}
        ></PopupContent>
      </Container>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addNoteClick: (data, response) =>
      dispatch(
        addNote(data, generateUUID(), response.scrollPosition, response.page)
      )
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Popup);
