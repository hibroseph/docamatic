import React from "react";
import { connect } from "react-redux";
import { addNote } from "../redux/actions";
import { generateUUID } from "../utils/GenerateUUID";

const NewNote = ({ dispatch }) => {
  let UUID = generateUUID();

  return (
    <div>
      <button
        type="submit"
        onClick={() => {
          UUID = generateUUID();
          console.log("UUID inside of onClick: " + UUID);
          dispatch(addNote("Note", UUID));
        }}
      >
        Note
      </button>
    </div>
  );
};

export default connect()(NewNote);
