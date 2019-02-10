import styled from "styled-components";

export const MiniSearchNoteContainer = styled.div`
  position: relative;
  width: 250;
  font-size: 15px;
  border-radius: 2px;
  margin: 15px;

  -webkit-box-shadow: 6px 6px 26px -8px #000000;
  box-shadow: 6px 6px 26px -8px #000000;

  .title-bar {
    position: relative;
    width: 250px;
    height: 20px;
    padding: 8px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    color: white;
  }
  .body {
    box-sizing: border-box;
    position: relative;
    background-color: white;
    width: 250px;
    padding: 8px;
  }
`;
