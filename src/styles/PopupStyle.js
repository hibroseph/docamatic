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
  overflow-y: auto;

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: lightgrey;
    border-radius: 100px;
    transition: all 0.1s ease-in-out;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: grey;
  }
`;
