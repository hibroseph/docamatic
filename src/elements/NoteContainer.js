import styled from "styled-components";

export const NoteContainer = styled.div`
  overflow: visible;

  .note-drag-handle {
    width:100%;
    height: 20px;
    background-color: blue;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }

  .note {
    position: absolute;
    width: 100%;
    height: 100%;

    background-color: #f4f4f4;
    
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;

    resize: both;
    overflow: auto;

    min-width: 100px;
    min-height: 100px;
    -webkit-box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
    -moz-box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
    box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
  }

  .color-picker {
    position: absolute !important;
    top: 70px !important;
    left: 40px !important;
  }

  .nav-bar-item-color {
    position: absolute;
    top: 18px;
    right: 36px;
    color: white;
  }

  .nav-bar-item-delete {
    position: absolute;
    size: 25px;
    top: 18px;
    right: 16px;
    color: white;
  }

  .title-bar {
    position: absolute;
    width: 100%;
    height: 60px;

    background-color: #35a1ec;
  }

  .title-input::placeholder {
    color: #f4f4f4;
  }

  .title-input:focus {
    outline: none;
  }

  .title-input {
    position: absolute;
    box-sizing: border-box;
    height: 60px;
    width: calc(100% - 60px);
    font-size: 17px;
    background-color: transparent;
    padding-left: 20px;
    color: #f4f4f4;
    border: none;
    user-select: none;
    /*   border: solid 1px black;; */
  }

  .note-input {
    position: absolute;
    box-sizing: border-box;
    top: 80px;
    left: 0;
    right: 0;
    bottom: 0;

    width: 100%;

    resize: none;

    font-size: 15px;
    padding: 10px 20px 10px 18px;
    margin-bottom: 10px;
    background-color: transparent;
    border: none;
  }

  .note-input:focus {
    outline: none;
  }
`;
