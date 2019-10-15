import styled from "styled-components";

export const MiniSearchNoteContainer = styled.div`
  position: relative;
  font-size: 15px;
  border-radius: 10px;
  margin: 10px 10px 0px 10px;
  box-shadow: 0px 4px 17px -5px rgba(0, 0, 0, 0.75);

  .title-bar {
    position: relative;
    height: 20px;
    padding: 8px 0px 8px 8px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    color: ${props => props.color.text};
    background-color: ${props => props.color.title};
    font-weight: bold;
  }

  .body {
    box-sizing: border-box;
    position: relative;
    background-color: white;
    width: 100%;
    padding: 8px;
  }

  .title-bar:hover ~ .body {
    filter: brightness(0.85);
  }

  .body:hover {
    filter: brightness(0.85);
  }
`;
