import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover } from "react-tiny-popover";
import { IconListStyle as Container } from "./IconListStyle";
import styled from "styled-components";

export const StyledPopup = styled.div`
  padding: 20px;
  background-color: #ebecf0;
  margin: 10px;
  font-weight: bold;
  font-size: 15px;
  border-radius: 10px;
  opacity: 0.95;
`;

export const IconList = (props) => {
  const [isPopupOpen, setIsPopupOpen] = useState({ Icon: "none", Open: false });
  const [openPopupTimerId, setPopupTimerId] = useState(null);
  const DetermineIfSelected = (name) => {
    if (props.page == name) {
      return "selected";
    } else {
      return "";
    }
  };

  return (
    <Container>
      {props.icons.map((icon) => {
        return (
          <Popover
            key={icon.name}
            isOpen={isPopupOpen.Icon == icon.name && isPopupOpen.Open}
            positions={["right"]}
            content={<StyledPopup>{icon.title}</StyledPopup>}
          >
            <FontAwesomeIcon
              icon={icon.type}
              className={`icon ${DetermineIfSelected(icon.name)}`}
              onClick={() => props.onClicky(icon.name)}
              onMouseEnter={() => {
                console.log("Mouse is entering " + icon.name);
                var timer = setTimeout(() => setIsPopupOpen({ Icon: icon.name, Open: true }), 500);
                setPopupTimerId(timer);
              }}
              onMouseLeave={() => {
                console.log("Mouse is exiting " + icon.name);
                setIsPopupOpen({ Icon: "none", Open: false });
                clearTimeout(openPopupTimerId);
              }}
            ></FontAwesomeIcon>
          </Popover>
        );
      })}
    </Container>
  );
};
