import React from "react";
import styled from "styled-components";

const DetermineColor = (props) => {
  if (props.success) {
    return "#5EDD64";
  }

  if (props.failure) {
    return "#D61818";
  }

  return "#2172C4";
};

const $Toast = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
  background-color: ${(props) => DetermineColor(props)};
  color: white;
  font-size: 15;
  font-weight: bold;
  left: 0px;
`;

const Toast = (props) => {
  return (
    <$Toast>
      <p>{props.message}</p>
    </$Toast>
  );
};

export default Toast;
