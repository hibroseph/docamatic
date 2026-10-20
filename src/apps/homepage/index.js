import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux"
import { addNote } from "../../redux/actions";
import reducer from "../../redux/reducer";

import NoteList from "../../components/NoteList";
import { generateUUID } from "../../utils/GenerateUUID";
import { noteUrlFor } from "../../utils/noteUrl";

// A live demo on the website: the extension's real note components with a
// local store, so visitors can try a note without installing anything.
// Nothing here may rely on extension APIs (chrome.runtime etc.), which don't
// exist on a normal website.

const renderIn = document.getElementById("docamatic-render")

let store = createStore(reducer, {
    pages: {},
    tags: []
  })

let element = document.getElementById("create-note-button")

element.addEventListener("click", () => {
    // Saved under the same url rule the extension uses, which the list looks up
    store.dispatch(addNote(generateUUID(), Math.random() * ((window.innerHeight + window.scrollY) - window.scrollY + 1) + window.scrollY, noteUrlFor(window.location.href)))
})

ReactDOM.render(<Provider store={store}>
    <NoteList url={window.location.href} windowWidth={window.innerWidth} disconnected={false}></NoteList>
    </Provider>, renderIn)