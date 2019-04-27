import styled from "styled-components";

export const MiniSearchNoteContainer = styled.div`
  position: relative;
  width: 280px;
  font-size: 15px;
  border-radius: 5px;
  margin: 10px 0px 0px 10;
  box-shadow: 10px 10px 58px 5px rgba(0, 0, 0, 0.1);

  .title-bar {
    position: relative;
    width: 100%;
    height: 20px;
    padding: 8px 0px 8px 8px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    color: white;
  }
  .body {
    box-sizing: border-box;
    position: relative;
    background-color: white;
    width: 100%;
    padding: 8px;
  }
`;
