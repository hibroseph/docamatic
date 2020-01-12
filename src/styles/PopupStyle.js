import styled from "styled-components";

export const PopupStyle = styled.div`
  background-color: lightgrey;
  width: 100%;
  height: 100%;
`;

export const PopupContentStyle = styled.div`
  position: absolute;
  top: 0px;
  left: 70px;
  width: calc(100% - 70px);
  height: 100%;

  background-color: white;
`;
