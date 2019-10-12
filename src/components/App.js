// This is the App that will be running in the chrome webpage. This handles displaying the notes that exist on the page
import React, { Component } from "react";
// import styled from "styled-components";
import NoteList from "./NoteList";
import * as Sentry from "@sentry/browser";
import { ENVIRONMENT, RELEASE, VERSION } from "../utils/constants";

class App extends Component {
  constructor(props) {
    super(props);

    // Initializing Sentry
    Sentry.init({
      dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
      environment: ENVIRONMENT,
      release: RELEASE + VERSION
    });
  }

  render() {
    return (
      <div>
        <NoteList />
      </div>
    );
  }
}

export default App;
