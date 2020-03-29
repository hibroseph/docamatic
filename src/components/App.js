// This is the App that will be running in the chrome webpage. This handles displaying the notes that exist on the page
import React, { Component } from "react";
// import styled from "styled-components";
import NoteList from "./NoteList.tsx";
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

    this.state = {
      scrollYOffset: window.pageYOffset,
      timer: null
    };

    this.listenToScroll = this.listenToScroll.bind(this);
  }

  componentDidMount() {
    window.addEventListener("scroll", this.listenToScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.listenToScroll);
  }

  listenToScroll() {
    if (this.state.timer !== null) {
      clearTimeout(this.state.timer);
    }

    let timer = setTimeout(() => {
      console.log("THE USER STOPPED SCROLLINGGG!!!");
      // update the position of the note we are currently on
    }, 500);

    this.setState({ scrollYOffset: window.pageYOffset, timer: timer });
  }

  render() {
    return (
      <div>
        <NoteList scrollYOffset={this.state.scrollYOffset} />
      </div>
    );
  }
}

export default App;
