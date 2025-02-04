// This is the App that will be running in the chrome webpage. This handles displaying the notes that exist on the page
import React, { Component } from "react";
// import styled from "styled-components";
import NoteList from "./NoteList.js";
import { GetSafeNoteUrl } from "../utils/GetSafeNoteUrl";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      scrollYOffset: window.pageYOffset,
      current_url: GetSafeNoteUrl(location.href),
      timer: null,
      disconnected: false,
      windowWidth: window.innerWidth
    };

    this.listenToScroll = this.listenToScroll.bind(this);
    this.listenForUrlChange = this.listenForUrlChange.bind(this);
    this.listenForHistoryChanges = this.listenForHistoryChanges.bind(this);
    this.listenForDisconnect = this.listenForDisconnect.bind(this);
    this.listenForWindowResize = this.listenForWindowResize.bind(this);
    //chrome.runtime.sendMessage({ action: CHROME_MESSAGES.ERROR_OCCURRED }, () => {});
  }

  listenForDisconnect() {
    console.log("adding global listener for disconnect")

    // This gets called when the service worker goes inactive AND on app restart
    document.addEventListener('docamatic-disconnect', () => {
      console.log("docamatic-disconnect event occurred")
      this.setState({disconnected: true});
    })
  }

  listenForWindowResize() {
    console.log("adding window event listener")

    window.addEventListener('resize', (event) => {
      console.log("resizing")
      this.setState({ windowWidth: window.innerWidth })
    })
  }

  /*
  This listener is used to update the notes when the page doesn't do a full refresh
  */
  listenForUrlChange() {
    let url = GetSafeNoteUrl(location.href);

    document.body.addEventListener(
      "click",
      () => {
        requestAnimationFrame(() => {
          if (url !== GetSafeNoteUrl(location.href)) {
            url = GetSafeNoteUrl(location.href);
            this.setState({
              current_url: url,
            });
          }
        });
      },
      true
    );
  }

  /*
  This listener is used to update the url when a user uses the back and forwards buttons on history
   */
  listenForHistoryChanges() {
    window.addEventListener("popstate", (event) => {
      this.setState({
        current_url: event.currentTarget.location.href,
      });
    });
  }

  componentDidMount() {
    window.addEventListener("scroll", this.listenToScroll);
    this.listenForUrlChange();
    this.listenForHistoryChanges();
    this.listenForDisconnect();
    this.listenForWindowResize();
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
        <NoteList windowWidth={this.state.windowWidth} disconnected={this.state.disconnected} url={this.state.current_url} scrollYOffset={this.state.scrollYOffset} />
      </div>
    );
  }
}

export default App;
