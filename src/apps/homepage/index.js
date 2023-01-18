import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux"
import { addNote } from "../../redux/actions";
import reducer from "../../redux/reducer";

import NoteList from "../../components/NoteList";
import { generateUUID } from "../../utils/GenerateUUID";

const renderIn = document.getElementById("docamatic-render")

let store = createStore(reducer, {
    pages: {},
    tags: []
  })

let element = document.getElementById("create-note-button")

element.addEventListener("click", () => {
    store.dispatch(addNote(generateUUID(), Math.random() * ((window.innerHeight + window.scrollY) - window.scrollY + 1) + window.scrollY, window.location.href))
})

ReactDOM.render(<Provider store={store}>
    <NoteList url={window.location.href} windowWidth={window.innerWidth} disconnected={false}></NoteList>
    </Provider>, renderIn)