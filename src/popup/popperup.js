import React, { Component } from "react";
import Search from "../components/Search";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";
import { PopupContainer } from "../elements/PopupContainer";
import PopupButtons from "../components/PopupButtons";
import { SearchResultsContainer } from "../elements/SearchResultsContainer";

class PopperUp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      search_query: null
    };
  }

  render() {
    return (
      <PopupContainer>
        <PopupButtons
          onSearch={value => {
            // update local state with search query
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

        {this.state.search_query == null && (
          <img
            src="search_results.png"
            style={{ position: "absolute", top: 195 }}
          />
        )}

        {this.state.search_query != null && (
          <SearchResultsContainer>
            <div id="note_scroll_list">
              {Object.keys(this.props.state).map(key => {
                console.log("searching for a note");
                return this.props.state[key].notes.map(note => {
                  if (this.state.search_query != null) {
                    if (
                      note.body.includes(this.state.search_query) ||
                      note.title.includes(this.state.search_query)
                    ) {
                      console.log("we found a match!");

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
                  }
                });
              })}
            </div>
          </SearchResultsContainer>
        )}
      </PopupContainer>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state
  };
};

export default connect(mapStateToProps)(PopperUp);
