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
      current_url: location.href,
      timer: null
    };

    this.listenToScroll = this.listenToScroll.bind(this);
    this.listenForUrlChange = this.listenForUrlChange.bind(this);


  }

  listenForUrlChange() {
    let url = location.href;
    document.body.addEventListener('click', () => {
      requestAnimationFrame(() => {
        if (url !== location.href) {
          url = location.href;
          this.setState({
            current_url: url
          })
        }
      });
    }, true);
  }

  componentDidMount() {
    window.addEventListener("scroll", this.listenToScroll);
    this.listenForUrlChange();
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.listenToScroll);
  }

  listenToScroll() {
    if (this.state.timer !== null) {
      clearTimeout(this.state.timer);
    }

    let timer = setTimeout(() => {
      // update the position of the note we are currently on
    }, 500);

    this.setState({ scrollYOffset: window.pageYOffset, timer: timer });
  }

  render() {
    return (
      <div>
        <NoteList url={this.state.current_url} scrollYOffset={this.state.scrollYOffset} />
      </div>
    );
  }
}

export default App;
