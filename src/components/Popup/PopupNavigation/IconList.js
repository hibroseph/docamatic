import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { IconListStyle as Container } from "./IconListStyle";
import { TEST_IDS } from "../../../utils/testIds";

export const IconList = props => {
  const DetermineIfSelected = (name) => {
    if (props.page == name) {
      return 'selected';
    } else {
      return '';
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
            data-testid={TEST_IDS.popupNav(icon.name)}
          />
        );
      })}
    </Container>
  );
};
