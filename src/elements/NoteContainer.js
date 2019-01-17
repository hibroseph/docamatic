import styled from "styled-components";

export const NoteContainer = styled.div`
  width: 150px;
  height: 450px;

  padding-left: 20px;
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 20px;

  display: inline-block;
  position: absolute;
  font-family: "arial";

  min-width: 100px;

  resize: both;
  overflow: hidden;

  -webkit-box-shadow: 5px 5px 13px -3px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 5px 5px 13px -3px rgba(0, 0, 0, 0.75);
  box-shadow: 5px 5px 13px -3px rgba(0, 0, 0, 0.75);

  .nav {
    position: absolute;
    top: 0px;
    left: 0px;
    margin-top: 5px;
    margin-left: 2px;
    margin-right: 2px;
    margin-bottom: 5px;
  }

  #title {
    float: left;
    background: transparent;
    border: none;
    font-size: 28px;
    font-weight: bold;
    width: -webkit-calc(100% - 90px);
    width: -moz-calc(100% - 90x);
    width: calc(100% - 90px);
  }

  #settings-title {
    font-size: 28px;
    font-weight: bold;
  }

  #settings-items {
    font-size: 15px;
    font-weight: bold;
  }

  #settings-save {
    background-color: white;
    opacity: 0.8;
    border-radius: 5px;
    padding: 10px;
    padding-left: 15px;
    padding-right: 15px;
    border: none;
    font-size: 15px;
    font-weight: bold;
    position: absolute;
    bottom: 20px;
    left: 15px;
  }

  #settings-page {
    position: relative;
    width: 100%;
    height: 100%;
  }

  #color-picker {
    background-color: white;
    border-radius: 5px;
    padding: 10px;
    width: 246px;
  }

  #note {
    width: 100%;
    height: 100%;
    background-color: white;
    position: relative;

  }

  .nav #settings {
    color: black;
    float: right;
    margin-right: 5px;
  }

  #delete {
    float: right;
  }

  #note-body {
    box-sizing: border-box;
    width: 100%;
    height: 100%;

    resize: none;

    border: 0px;
    background: transparent;
    position: absolute;
    top: 30px;
    left:0; 
    right:0; 
    bottom:0;
  }

  .inline {
    display: inline-block;
    width: 100%;
  }

  .menu_icons {
    float: right;
    height: 24px;
    width: auto;
  }
`;
