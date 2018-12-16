import styled from "styled-components";


export const NoteContainer = styled.div`
  padding-left: 20px;
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 5px;
  display: inline-block;
  position: absolute;
  font-family: "arial";

  -webkit-box-shadow: 5px 5px 13px -3px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 5px 5px 13px -3px rgba(0, 0, 0, 0.75);
  box-shadow: 5px 5px 13px -3px rgba(0, 0, 0, 0.75);

  /* width: 300px; */

  height: inherit;
  width: inherit;

  .title_bar {
    height: 100%;
  }

  .note_title {
    width: 80%;
    border: 0px;
    font-weight: bold;
    resize: none;
    background: transparent;
    font-size: 30px;
    padding-bottom: 10px;
    float: left;
  }

  .note_body {
    box-sizing: border-box;
    min-width: 120px;
    width: 150px; 
    height: 300px;

    /* resize: none; */
    border: 0px;
    background: transparent;
  }

  .inline {
    display: inline-block;
    width: 100%;
  }

  .colorChange {
    background-color: #4caf50;
    padding-left: 20px;
    float: none;
  }

  .menu_icons {
    float: right;
    height:24px;
    width: auto;
  }
`;
