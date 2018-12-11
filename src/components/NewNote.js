import React from "react";
import { connect } from "react-redux";
import { addNote } from "../redux/actions";
import { generateUUID } from "../utils/GenerateUUID";
import { changeConfirmLocale } from "antd/lib/modal/locale";

// chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
//   console.log(response.farewell);
// });

const NewNote = ({ dispatch }) => {
  let UUID = generateUUID();

  return (
    <div>
      <button
        type="submit"
        onClick={() => {
          UUID = generateUUID();
          // console.log("UUID inside of onClick: " + UUID);

          // TODO: Adding loading symbol while were waiting for the response

          // This is used to request the current scroll position from the HTML document
          // When we get the response, then we add the note.
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            console.log("Sending message on: ");
            console.log(tabs);

            chrome.tabs.sendMessage(
              tabs[0].id,
              { newNote: "" },
              response => {
                
                console.log("Response:");
                console.log(response);
                // Dispatching action to redux
                dispatch(addNote("Note", UUID, response.scrollPosition, response.page));
              }
            );
          });
        }}
      >
        New Note
      </button>
    </div>
  );
};

export default connect()(NewNote);
