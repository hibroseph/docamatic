import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const MiniSearchNoteContainer = styled.div`
  position: relative;
  
  .url-preview {
    font-weight: bold;
    margin-bottom: 0px;
    margin-left: 10px;
  }

  input#title {
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

  #body {
    overflow-y: hidden;
    width: 100%;
    box-sizing: border-box;
    font-family: Roboto, Arial, Helvetica, sans-serif;
    outline: none;
    padding: 10px;
    background-color: transparent;
    border: none;
    resize: none;
    transition: height .3s ease-out;
  }

  .manageIcons {
    display: flex;
    justify-content: space-between;
    width:15%;
    margin-right: 15px;
  }

  .icon {
    transition: all 0.1s ease-in-out;
  }

  .icon:hover {
    transform: scale(1.2);
  }

  .note {
  font-size: 15px;
    border-radius: 10px;
    margin: 5px 10px 0px 10px;
    box-shadow: 0px 4px 17px -5px rgba(0, 0, 0, 0.75);
  }

  .title-bar {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 8px 0px 8px 8px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    color: ${props => props.color.text};
    background-color: ${props => props.color.title};
    font-weight: bold;
    overflow-wrap: break-word;
  }

  .body {
    box-sizing: border-box;
    position: relative;
    background-color: white;
    width: 100%;
    padding: 8px;
  }

  .note:hover {
    filter: brightness(0.95);
  }
`;
