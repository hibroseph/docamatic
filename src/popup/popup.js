import React, { Component } from "react";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";
import { PopupContainer } from "../elements/PopupContainer";
import PopupButtons from "../components/PopupButtons";
import { SearchResultsContainer } from "../elements/SearchResultsContainer";
import "../elements/PopupStyle.css";
import "../css/popup.css";
import { Icon, Button } from "antd";
import * as Sentry from "@sentry/browser";
import { generateUUID } from "../utils/GenerateUUID";
import { addNote } from "../redux/actions";

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
      page: "home"
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
              <Icon
                type="setting"
                className="setting-menu-style"
                onClick={() => {
                  this.setState({
                    page: "settings"
                  });
                }}
              />

              <button
                className="primary-button"
                onClick={() => {
                  chrome.runtime.sendMessage(
                    { code: "runContentScript" },
                    resp => {
                      console.log("We recieved a response: " + resp);
                    }
                  );
                  Sentry.captureMessage("A user added a note");

                  let UUID = generateUUID();
                  // console.log("UUID inside of onClick: " + UUID);

                  // TODO: Adding loading symbol while were waiting for the response

                  // This is used to request the current scroll position from the HTML document
                  // When we get the response, then we add the note.

                  // eslint-disable-next-line no-undef
                  chrome.tabs.query(
                    { active: true, currentWindow: true },
                    tabs => {
                      // console.log("Sending message on: ");
                      // console.log(tabs);

                      // eslint-disable-next-line no-undef
                      chrome.tabs.sendMessage(
                        tabs[0].id,
                        { newNote: "" },
                        response => {
                          // console.log("Response:");
                          // console.log(response);

                          // if (!response) {
                          //   console.log("Your scroll position was equal to undefined");

                          //   Sentry.captureMessage("Scroll Position of undefined", "error")
                          // }
                          // Dispatching action to redux
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
                            console.log(
                              "An error was captured and reported to sentry"
                            );
                            console.debug(
                              "I think this has to do with the URL and it not being a valid webpage"
                            );
                            Sentry.captureException(err);
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
                  src="../assets/search_results.png"
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
                  src="../assets/no_results.png"
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
              onChange={data => {
                console.log(data.value);
              }}
            />
            <button
              className="fb-btn"
              onClick={() => {
                // Grab data from text area and send it to Sentry
                let element = document.getElementById("fb-ta");
                Sentry.captureMessage("Feedback:" + element.value);
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
              <h1 id="title-settings">Feedback</h1>

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
                <img alt="Thank You" src="../assets/feedback-thank-you.png" />
              )}
              <button
                className="primary-button"
                onClick={() => {
                  let textArea = document.getElementById("input-feedback");

                  if (textArea.value === "") {
                    console.log("User inputted nothing");
                  } else {
                    try {
                      Sentry.captureMessage("Feedback:" + textArea.value);
                      // If this is successful, display the image
                      this.setState({
                        feedback: "complete"
                      });
                    } catch (error) {
                      console.log("There was an error with reporting feedback");
                      console.log(error);
                      Sentry.captureException(error);
                    }
                  }
                }}
              >
                Send Feedback
              </button>

              <div id="settings-buttons">
                {/* <button
                className="primary-button"
                onClick={() => {
                  this.displayHome();
                }}
              >
                Save
              </button> */}
              </div>
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
