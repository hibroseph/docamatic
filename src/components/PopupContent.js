import React from "react";
import { PopupContentStyle } from "../styles/PopupStyle";
import SearchNotes from "./SearchNotes";
import HeartNotes from "./HeartNotes";
import SortNotes from "./SortNotes";
import Settings from "./Settings";
import Alerts from "./Settings";
import NoAddedNotes from "../assets/NoAddedNotes.png"
import Welcome from "../assets/Welcome.png";
import FilterNotes from "./FilterNotes";
export const PopupContent = props => {
  return (
    <PopupContentStyle>
      {(() => {
        switch (props.page) {
          case "sort":
            return <SortNotes></SortNotes>;
          case "hearted":
            return <HeartNotes></HeartNotes>;
          case "search":
            return <SearchNotes></SearchNotes>;
          case "settings":
            return <Settings></Settings>;
          case "alerts":
            return <Alerts></Alerts>;
          default:
            return (
              <FilterNotes
                filter={note => {
                  return true
                }}
                noResultsImg={NoAddedNotes}
              ></FilterNotes>
            );
        }
      })()}
    </PopupContentStyle>
  );
};
