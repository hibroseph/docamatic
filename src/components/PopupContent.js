import React from "react";
import { PopupContentStyle } from "../styles/PopupStyle";
import SearchNotes from "./SearchNotes";
import HeartNotes from "./HeartNotes";

export const PopupContent = props => {
  return (
    <PopupContentStyle>
      {(() => {
        switch (props.page) {
          case "sort":
            return "Sort Notes";
          case "hearted":
            return <HeartNotes state={props.state}></HeartNotes>;
          case "search":
            return <SearchNotes state={props.state}></SearchNotes>;
          case "settings":
            return "Settings";
          case "alerts":
            return "Alerts";
          default:
            return "Default Page";
        }
      })()}
    </PopupContentStyle>
  );
};
