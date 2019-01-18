import React, { Component } from "react";
import NewNote from "../components/NewNote";
import Search from "../components/Search";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";
import IconBar from "../components/IconBar";
import { PopupContainer } from "../elements/PopupContainer";
import { SearchResultsContainer } from "../elements/SearchResultsContainer";
class Popup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      search_query: null
    };
  }

  render() {
    console.log("popup.js state:");
    console.log(this.props.state);

    // What are the keys?
    console.log("The keys of the state:");
    console.log(Object.keys(this.props.state));

    return (
      <PopupContainer>
        <IconBar />

        <Search
          onSearch={value => {
            // Update the component state of the search query
            if (value != "") {
              this.setState({
                search_query: value
              });
            } else {
              this.setState({
                search_query: null
              });
            }
          }}
        />

        <SearchResultsContainer>
          <div id="note_scroll_list">
            {Object.keys(this.props.state).map(key => {
              return this.props.state[key].notes.map(note => {
                if (this.state.search_query != null) {
                  if (
                    note.body.includes(this.state.search_query) ||
                    note.title.includes(this.state.search_query)
                  ) {
                    console.log(
                      "We found a note that matches your search query"
                    );
                    console.log("The key of note " + note.id + " is " + key);

                    // Split the text to bold the part that is the search query
                    let text = note.body.split(this.state.search_query);

                    return (
                      <MiniSearchNote
                        {...note}
                        splitAtQueryText={text}
                        searchQuery={this.state.search_query}
                        website={key}
                      />
                    );
                  }
                } else {
                  return <div> </div>;
                }
              });
            })}
          </div>
        </SearchResultsContainer>
      </PopupContainer>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state
  };
};

export default connect(mapStateToProps)(Popup);
