import React, { Component } from "react";
import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import NoHeartNotes from "../assets/NoHeartNotes.png";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";

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
          {Object.keys(this.props.notes).map(key => {
            return this.props.state[key].notes.map(note => {
              if (note.heart) {
                foundNotes = true;
                return (
                  <MiniSearchNote
                    {...note}
                    // bodySplitAtQueryText={text}
                    // titleSplitAtQueryText={title}
                    searchQuery={this.state.search_query}
                    website={key}
                  />
                );
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
    return { notes: state };
  },
  null
)(HeartNotes);
