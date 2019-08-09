import React, { Component } from "react";
import "../css/ErrorPopupStyle.css";

class ErrorPopup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error_msg: "Nothing important"
    };
  }
  render() {
    return (
      <div className="main_error_container">
        <div className="error_title">
          <h2 className="error_title_text"> Something Bad Happened </h2>
        </div>

        <div className="error_description">
          <p>
            Sadly this extension is not perfect and something didn't work
            correctly. Please describe below what happened so we can fix it.{" "}
          </p>
        </div>

        <div className="error_feedback">
          <textarea
            onChange={event => {
              this.setState({
                error_msg: event.target.value
              });
            }}
            className="error_textarea"
            placeholder="What led to this message?    What were you trying to do?"
          />
        </div>
        <div className="button_area">
          <button
            onClick={() => {
              this.props.onErrorReported(this.state.error_msg);
            }}
            className="button submit_button"
          >
            Submit
          </button>
          <button
            onClick={() => {
              this.props.onClose();
            }}
            className="button cancel_button"
          >
            {" "}
            Cancel{" "}
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorPopup;
