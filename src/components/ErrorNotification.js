import React, { Component } from "react";
import "../css/ErrorNotificationStyle.css";

class ErrorNotification extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error_msg: "Nothing important"
    };
  }
  render() {
    return (
      <div className="ErrorNotification">
        <div className="title-area">
          <p className="title">Oh no.. Something Went Wrong</p>
        </div>
        <p className="subtext">
          Were not sure what happened, but we need to fix it now! Please
          describe below what actions led to this message and what you were
          trying to do
        </p>
        <textarea
          onChange={event => {
            this.setState({
              error_msg: event.target.value
            });
          }}
          hint="What happened?"
          className="feedback"
        />

        <button
          className="btn"
          onClick={() => this.props.onErrorReported(this.state.error_msg)}
        >
          Send
        </button>
        <button className="btn" onClick={() => this.props.onClose()}>
          Close
        </button>
      </div>
    );
  }
}

export default ErrorNotification;
