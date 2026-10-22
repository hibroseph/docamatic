// The website's script, on every page: the design system's styles, visit
// counts (analytics.js), and on the home page a live demo: the extension's
// real note components with a local store, so visitors can try a note
// without installing anything. Nothing here may rely on extension APIs
// (chrome.runtime etc.), which don't exist on a normal website.
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";
import "../../styles/tokens.css";
import "../../styles/fonts.css";
import "../../../design-system/components/bundle.css";
import "./site.css";
import { addNote, addText, addTitle, updateNotePosition } from "../../redux/actions";
import reducer from "../../redux/reducer";
import NoteList from "../../components/NoteList";
import { generateUUID } from "../../utils/GenerateUUID";
import { noteUrlFor } from "../../utils/noteUrl";
import { startAnalytics, trackWebsite } from "./analytics";

startAnalytics();

const renderIn = document.getElementById("docamatic-render");
const art = document.getElementById("hero-art");
const button = document.getElementById("create-note-button");

if (renderIn && art && button) {
  const store = createStore(reducer, { pages: {}, tags: [] });
  // Saved under the same url rule the extension uses, which the list looks up
  const url = noteUrlFor(window.location.href);
  let added = 0;

  // A note at a spot in the dotted area beside the headline
  const noteAt = (title, body) => {
    const area = art.getBoundingClientRect();
    const offset = (added++ % 6) * 28;
    const x = Math.round(area.left + window.scrollX + Math.min(48, area.width / 8) + offset);
    const y = Math.round(area.top + window.scrollY + 32 + offset);
    const id = generateUUID();
    store.dispatch(addNote(id, y, url));
    store.dispatch(updateNotePosition(id, x, y, url));
    if (title) store.dispatch(addTitle(id, title, url));
    if (body) store.dispatch(addText(id, body, url));
  };

  ReactDOM.render(
    <Provider store={store}>
      <NoteList url={window.location.href} windowWidth={window.innerWidth} disconnected={false}></NoteList>
    </Provider>,
    renderIn
  );

  // One to start with, so there's something to try right away
  // (after the fonts load, which can move the dotted area)
  document.fonts.ready.then(() => noteAt("Try me", "Drag me by my colored top bar, or click here and write something."));

  button.addEventListener("click", () => {
    noteAt();
    trackWebsite("website_demo_note_added", { method: "button" });
  });
}
