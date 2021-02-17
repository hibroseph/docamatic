import React from "react";
import styled from "styled-components";

const $PopupWindow = styled.div`
  position: absolute;
  top: 100px;
  left: 110px;
  width: 250px;
  height: 200px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 3px 3px 15px -2px #000000;
`;

const $PopupTitle = styled.div`
  box-sizing: border-box;
  width: 100%;
  background-color: #08597d;
  color: white;
  padding: 10;
  font-weight: bold;
  border-radius: 10px 10px 0px 0px;
`;

const PopupWindow = (props) => {
  return (
    <$PopupWindow>
      <$PopupTitle>{props.title}</$PopupTitle>
      {props.children}
    </$PopupWindow>
  );
};

export default PopupWindow;
