import React from "react";
import { PopupContentStyle } from "./style";
import SearchNotes from "./Pages/SearchNotes";
import HeartNotes from "./Pages/HeartNotes";
import SortNotes from "./Pages/SortNotes";
import Settings from "./Pages/Settings";
import CurrentPageNotes from './Pages/CurrentPageNotes/CurrentPageNotes'
export const PopupContent = props => {
  return (
    <PopupContentStyle>
      {(() => {
        switch (props.page) {
          case "current":
            return <CurrentPageNotes createNewNote={props.createNewNote}></CurrentPageNotes>
          case "sort":
            return <SortNotes></SortNotes>;
          case "hearted":
            return <HeartNotes></HeartNotes>;
          case "search":
            return <SearchNotes></SearchNotes>;
          case "settings":
            return <Settings></Settings>;
          default:
            return (
              <p>There has been an error</p>
            );
        }
      })()}
    </PopupContentStyle>
  );
};
