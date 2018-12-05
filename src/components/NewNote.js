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
          console.log("UUID inside of onClick: " + UUID);

          // TODO: Adding loading symbol while were waiting for the response

          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { scrollPosition: "currentScrollPosition" },
              response => {
                console.log("We recieved a response in the extension");
                console.log(response.scrollPosition);

                // Dispatching action to redux
                dispatch(addNote("Note", UUID, response.scrollPosition));
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
