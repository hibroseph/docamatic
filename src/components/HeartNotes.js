import React, { Component } from "react";
import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import MiniSearchNote from "../components/MiniSearchNote";
import NoHeartNotes from "../assets/NoHeartNotes.png";
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
    var foundNotes = false;
    return (
      <Container>
        <div className="searchresults">
          {Object.keys(this.props.state).map(key => {
            return this.props.state[key].notes.map(note => {
              if (note.heart) {
                foundNotes = true;
                return <MiniSearchNote {...note} website={key} />;
              }
            });
          })}
          {!foundNotes && (
            <img style={{ marginLeft: 10 }} src={NoHeartNotes}></img>
          )}
        </div>
      </Container>
    );
  }
}

export default connect(
  state => {
    return { state: state };
  },
  null
)(HeartNotes);
