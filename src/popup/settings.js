import React from "react";
import * as Sentry from "@sentry/browser"

const Settings = props => {
  return (
    <div id="popup-container">
      <div id="settings-top">
        <h1 id="title-settings">Settings</h1>

        <p id="title-feedback">
          We'd love to hear what you like, don't like, improvements, wanted
          features, etc.
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
};

export default Settings;