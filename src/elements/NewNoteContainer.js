import styled from "styled-components";

export const NewNoteContainer = styled.div`
  width: 300px;
  height: 400px;

  overflow: visible;

  .note {
    position: absolute;
    top: 300px;
    left: 300px;
    width: 300px;
    height: 400px;

    background-color: #f4f4f4;
    border-radius: 5px;
    resize: both;
    overflow: auto;

    -webkit-box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
    -moz-box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
    box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
  }

  .color-picker {
    position: absolute !important;
    top: 45px !important;
    right: -40px !important;
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
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }

  .title-input::placeholder {
    color: #f4f4f4;
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
    /*   border: solid 1px black;; */
  }

  .note-input {
    position: absolute;
    box-sizing: border-box;
    top: 60px;
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
`;
