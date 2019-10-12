import React from "react";
import { PopupContentStyle } from "../styles/PopupStyle";
export const PopupContent = props => {
  return (
    <PopupContentStyle>
      {(() => {
        switch (props.page) {
          case "recent":
            return "Recent History";
          case "hearted":
            return "Like Notes";
          case "search":
            return "Search Notes";
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
