import React, { Component } from "react";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";
import { PopupContainer } from "../elements/PopupContainer";
import { SearchResultsContainer } from "../elements/SearchResultsContainer";
import "../elements/PopupStyle.css";
import * as Sentry from "@sentry/browser";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";
import { ENVIRONMENT, RELEASE, VERSION } from "../utils/constants";

import NoResultsImage from "../assets/no_results.png";
import SearchResultsImage from "../assets/search_results.png";
import FeedbackThankYouImage from "../assets/feedback_thanks.png";

class Popup extends Component {
  constructor(props) {
    super(props);

    Sentry.init({
      dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
      environment: ENVIRONMENT,
      release: RELEASE + VERSION
    });

    this.state = {
      search_query: null,
      // For testing change to home
      page: "home",
      error: false
    };
  }

  displayHome() {
    this.setState({
      page: "home",
      feedback: "incomplete"
    });
  }

  render() {
    let foundItem = false;

    let page = null;

    switch (this.state.page) {
      case "home":
        page = (
          <div id="popup-container">
            <div id="menu-area">
              {/* <Icon
                type="setting"
                className="setting-menu-style"
                onClick={() => {
                  this.setState({
                    page: "settings"
                  });
                }}
              /> */}

              <button
                className="primary-button"
                onClick={() => {
                  // chrome.runtime.sendMessage(
                  //   { code: "runContentScript" },
                  //   resp => {
                  //
                  //   }
                  // );

                  // Sentry.captureMessage("A user added a note");

                  console.log("adding note");
                  let UUID = generateUUID();
                  // TODO: Adding loading symbol while were waiting for the response

                  // This is used to request the current scroll position from the HTML document
                  // When we get the response, then we add the note.

                  // eslint-disable-next-line no-undef
                  chrome.tabs.query(
                    { active: true, currentWindow: true },
                    tabs => {
                      // eslint-disable-next-line no-undef
                      chrome.tabs.sendMessage(
                        tabs[0].id,
                        { newNote: "" },
                        response => {
                          console.log("got a response from the backend");
                          try {
                            this.props.dispatch(
                              addNote(
                                "Note",
                                UUID,
                                response.scrollPosition,
                                response.page
                              )
                            );
                          } catch (err) {
                            console.log("uh oh, got an error");
                            this.setState({
                              error: true
                            });
                          }
                        }
                      );
                    }
                  );
                }}
              >
                Add Note
              </button>
              <input
                className="primary-input"
                placeholder="Search Your Notes"
                onChange={event => {
                  if (event.target.value !== "") {
                    this.setState({
                      search_query: event.target.value
                    });
                  } else {
                    this.setState({
                      search_query: null
                    });
                  }
                }}
              />
            </div>

            <div id="search-area">
              {this.state.search_query == null && (
                <img
                  alt="Search Results"
                  src={SearchResultsImage}
                  style={{
                    position: "relative",
                    top: 50,
                    backgroundColor: "white",
                    height: 205
                  }}
                />
              )}

              {this.state.search_query != null && (
                <SearchResultsContainer>
                  {Object.keys(this.props.state).map(key => {
                    return this.props.state[key].notes.map(note => {
                      if (this.state.search_query != null) {
                        if (
                          note.body.includes(this.state.search_query) ||
                          note.title.includes(this.state.search_query)
                        ) {
                          foundItem = true;
                          // Split the text to bold the part that is the search query
                          let title = note.title.split(this.state.search_query);
                          let text = note.body.split(this.state.search_query);

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
                  src={NoResultsImage}
                  style={{
                    position: "absolute",
                    top: 250,
                    backgroundColor: "white",
                    height: 205
                  }}
                />
              )}
            </div>
          </div>
        );

        break;
      case "feedback":
        page = (
          <div id="popup-container">
            <h1>Whatcha think?</h1>
            <p>
              We'd love to get some feedback on how to improve this application.
              This information is shared anonymously.
            </p>
            <textarea
              id="fb-ta"
              placeholder="Give us your feedback here!"
              onChange={data => {}}
            />
            <button
              className="fb-btn"
              onClick={() => {
                // Grab data from text area and send it to Sentry
                let element = document.getElementById("fb-ta");
                Sentry.captureMessage(
                  "Feedback >>" +
                    element.value +
                    "<< State >> " +
                    JSON.stringify(this.props.state) +
                    " <<"
                );
                this.displayHome();
              }}
            >
              Send
            </button>
            <button
              className="fb-btn"
              onClick={() => {
                this.displayHome();
              }}
            >
              Exit
            </button>
          </div>
        );
        break;
      case "settings":
        page = (
          <div id="popup-container">
            <div id="settings-top">
              <h1 id="title-settings">Settings</h1>

              <p id="title-feedback">
                We'd love to hear what you like, don't like, improvements,
                wanted features, etc.
              </p>

              {this.state.feedback !== "complete" && (
                <textarea
                  id="input-feedback"
                  placeholder="What do you think of Sticky Notes?"
                />
              )}

              {this.state.feedback === "complete" && (
                <img alt="Thank You" src={FeedbackThankYouImage} />
              )}
              <button
                className="primary-button"
                onClick={() => {
                  let textArea = document.getElementById("input-feedback");

                  if (textArea.value === "") {
                  } else {
                    try {
                      Sentry.addBreadcrumb({
                        level: "Feedback",
                        data: this.props.state,
                        message: textArea.value
                      });

                      Sentry.captureMessage("Feedback:" + textArea.value);

                      // If this is successful, display the image
                      this.setState({
                        feedback: "complete"
                      });
                    } catch (error) {
                      Sentry.captureException(error);
                    }
                  }
                }}
              >
                Send Feedback
              </button>

              <div id="settings-buttons"></div>
            </div>

            <div id="settings-bottom">
              <button
                className="primary-button button-settings-exit"
                onClick={() => {
                  this.displayHome();
                }}
              >
                Exit
              </button>
            </div>
          </div>
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
