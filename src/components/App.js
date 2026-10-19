// This is the App that will be running in the chrome webpage. This handles displaying the notes that exist on the page
import React, { Component } from "react";
import NoteList from "./NoteList.js";
import { onUrlChange } from "../utils/urlChanges";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // The full address; NoteList works out which saved urls apply to it
      current_url: location.href,
      disconnected: false,
      windowWidth: window.innerWidth
    };

    this.resizeFrame = null;
    this.updateUrl = this.updateUrl.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);
  }

  // Single page apps (x.com, YouTube, ...) change the url without reloading
  // the page, so the content script has to notice and show that page's notes.
  updateUrl() {
    const url = location.href;
    if (url !== this.state.current_url) {
      this.setState({ current_url: url });
    }
  }

  onResize() {
    // Resize fires many times per second while dragging the window edge;
    // re-render at most once per frame
    if (this.resizeFrame) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.setState({ windowWidth: window.innerWidth });
    });
  }

  // Fired by the store middleware when the extension was reloaded/updated and
  // this page's content script can no longer reach it
  onDisconnect() {
    this.setState({ disconnected: true });
  }

  componentDidMount() {
    // The background reports url changes Chrome sees (the reliable source);
    // the listeners below catch them a little sooner where they can
    this.stopListeningForUrlChanges = onUrlChange(this.updateUrl);
    // The Navigation API reports every same-document navigation, including
    // history.pushState from the page's own scripts (Chrome 102+)
    window.navigation?.addEventListener("navigatesuccess", this.updateUrl);
    // Fallback for anything the above misses: most SPA navigations start with
    // a click. updateUrl is a no-op when the url hasn't changed.
    this.onClick = () => requestAnimationFrame(this.updateUrl);
    document.addEventListener("click", this.onClick, true);
    // Back/forward buttons
    window.addEventListener("popstate", this.updateUrl);
    window.addEventListener("resize", this.onResize);
    document.addEventListener("docamatic-disconnect", this.onDisconnect);
  }

  componentWillUnmount() {
    this.stopListeningForUrlChanges?.();
    window.navigation?.removeEventListener("navigatesuccess", this.updateUrl);
    document.removeEventListener("click", this.onClick, true);
    window.removeEventListener("popstate", this.updateUrl);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("docamatic-disconnect", this.onDisconnect);
    cancelAnimationFrame(this.resizeFrame);
  }

  render() {
    return (
      <div>
        <NoteList windowWidth={this.state.windowWidth} disconnected={this.state.disconnected} url={this.state.current_url} />
      </div>
    );
  }
}

export default App;
