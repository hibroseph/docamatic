import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { IconListStyle as Container } from "../styles/IconListStyle";

export const IconList = props => {
  const DetermineIfSelected = (name) => {
    if (props.page == name) {
      return 'selected'
    }
  }

  return (
    <Container>
      {props.icons.map(icon => {
        return (
          <FontAwesomeIcon
            key={icon.name}
            icon={icon.type}
            className={`icon ${DetermineIfSelected(icon.name)}`}
            onClick={() => props.onClicky(icon.name)}
          />
        );
      })}
    </Container>
  );
};
