import React, { Component } from "react";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";
import { PopupContainer } from "../elements/PopupContainer";
import PopupButtons from "../components/PopupButtons";
import { SearchResultsContainer } from "../elements/SearchResultsContainer";
import "../elements/PopupStyle.css"
import * as Sentry from "@sentry/browser";

class Popup extends Component {
  constructor(props) {
    super(props);

    console.log("Initializing Sentry in the popup");
    Sentry.init({
      dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219"
    });

    this.state = {
      search_query: null,
      // For testing change to home
      page: "something"
    };
  }

  displayHome() {
    this.setState({
      page: "home"
    });
  }

  render() {
    let foundItem = false;

    let page = null;

    switch (this.state.page) {
      case "home":
        page = (
          <PopupContainer>
            <PopupButtons
              onSearch={value => {
                // update local state with search query
                if (value !== "") {
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
                alt="Search Results"
                src="../assets/search_results.png"
                style={{ position: "absolute", top: 195 }}
              />
            )}

            {this.state.search_query != null && (
              <SearchResultsContainer>
                {Object.keys(this.props.state).map(key => {
                  // console.log("searching for a note");
                  return this.props.state[key].notes.map(note => {
                    if (this.state.search_query != null) {
                      if (
                        note.body.includes(this.state.search_query) ||
                        note.title.includes(this.state.search_query)
                      ) {
                        // console.log("we found a match!");
                        foundItem = true;
                        // Split the text to bold the part that is the search query
                        let title = note.title.split(this.state.search_query);
                        let text = note.body.split(this.state.search_query);

                        // console.log("splitAtQueryText: " + text);
                        // console.log(
                        // "state.search_query" + this.state.search_query
                        // );

                        return (
                          <MiniSearchNote
                            {...note}
                            bodySplitAtQueryText={text}
                            titleSplitAtQueryText={title}
                            searchQuery={this.state.search_query}
                            website={key}
                          />
                        );
                      }
                    }
                  });
                })}
              </SearchResultsContainer>
            )}

            {this.state.search_query != null && !foundItem && (
              <img
                alt="There are no results"
                // src="no_results.png"
                src="../assets/no_results.png"
                style={{ position: "absolute", top: 195 }}
              />
            )}

            <button
              onClick={() => {
                this.setState({
                  page: "feedback"
                });
              }}
            >
              Send Feedback
            </button>
          </PopupContainer>
        );
        break;
      case "feedback":
        page = (
          <PopupContainer>
            <h1>Whatcha think?</h1>
            <p>
              We'd love to get some feedback on how to improve this application
            </p>
            <textarea placeholder="Give us your feedback here!" />
            <button
              onClick={() => {
                this.displayHome();
              }}
            >
              Send
            </button>
            <button
              onClick={() => {
                this.displayHome();
              }}
            >
              Exit
            </button>
          </PopupContainer>
        );
        break;
      default:
        //TODO: Update error page when something goes wrong
        //TODO: Add error reporting screen

        page = (
          <PopupContainer>
            <h1> Something went wrong! Sorry!</h1>
            <p> Could you describe what you were doing? </p>
            <p> Let's try again! Click the button below to reload page</p>
            <button
              onClick={() => {
                this.displayHome();
              }}
            >
              Reload Page
            </button>

            <p
              className="feedback-link"
              onClick={() => {
                this.displayHome();
              }}
            >
              Click here
            </p>
          </PopupContainer>
        );
        // This is not good, we need to report an error
        Sentry.captureMessage("Failed to render home page", "error");
    }

    return page;
  }
}

const mapStateToProps = state => {
  return {
    state: state
  };
};

export default connect(mapStateToProps)(Popup);
