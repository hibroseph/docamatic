import styled from "styled-components";

export const MiniSearchNoteContainer = styled.div`
    padding: 10px;
    width: inherit;
    height: auto;
    font-size: 15px;
    margin : 10px;
    border-radius:2px;

    .title-bar {
    position: absolute;
    width: 100%;
    height: 20px;

    background-color: #35a1ec;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
    .body {
    position: absolute;
    background-color: white;
    height: 40px;
    width: 100%;
    }
`