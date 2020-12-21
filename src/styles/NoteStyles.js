import styled from "styled-components";

export const NoteContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 10px 10px 0 0;
  box-sizing: border-box;
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
  box-shadow: 0px 4px 17px -5px rgba(0, 0, 0, 0.75);

  textarea::-webkit-scrollbar {
    width: 8px;
  }

  textarea::-webkit-scrollbar-track {
    background-color: transparent;
  }

  textarea::-webkit-scrollbar-thumb {
    background-color: lightgrey;
    border-radius: 100px;
    transition: all 0.1s ease-in-out;
  }

  textarea::-webkit-scrollbar-thumb:hover {
    background-color: grey;
  }

  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 10px 10px 0 0;
    box-sizing: border-box;
    position: relative;
    width: 100%;
    height: 40px;
    background-color: ${props => props.color.title};
  }

  .title p {
    display: inline-block;
    margin: 10px;
  }

  textarea {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    font-family: inherit;
    outline: none;
    padding: 10px;
    background-color: transparent;
    border: none;
    resize: none;
  }
  .icons {
    font-size: 16px;
    color: ${props => props.color.text};
  }

  .title .arrow:hover ~ .settings-container {
    left: 0px;
  }

  .settings-container:hover {
    left: 0px;
  }

  input {
    background-color: transparent;
    border: none;
    width: calc(100% - 30px);
    height: 100%;
    color: ${props => props.color.text};
    padding: 0 10px 0 10px;
    box-sizing: border-box;
    outline: none;
    font-weight: bold;
  }

  .body {
    width: 100%;
    height: calc(100% - 40px);
  }

  .settings-container {
    position: absolute;
    left: 100%;
    background-color: inherit;
    width: 100%;
    transition: 0.3s ease left;
    top: 0px;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: space-evenly;
    align-items: center;
  }

  .icon-container .icons {
    transition: all 0.1s ease-in-out;
  }
  .icon-container .icons:hover {
    transform: scale(1.2);
  }

  .icon-container:hover {
    left: 0px;
  }

  .icon-container {
    width: 100%;
    height: 40px;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
  }
`;
