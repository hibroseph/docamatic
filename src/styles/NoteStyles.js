import styled from "styled-components";

export const NoteContainer = styled.div`
  position: absolute !important;
  width: 100% !important;
  height: 100% !important;
  background-color: #f5f5f5 !important;
  border-radius: 10px 10px 0 0 !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  font-family: Arial, Helvetica, sans-serif !important;
  box-shadow: 0px 4px 17px -5px rgba(0, 0, 0, 0.75) !important;
  textarea::-webkit-scrollbar {
    width: 8px !important;
  }

  textarea::-webkit-scrollbar-track {
    background-color: transparent !important;
  }

  textarea::-webkit-scrollbar-thumb {
    background-color: lightgrey !important;
    border-radius: 100px !important;
    transition: all 0.1s ease-in-out !important;
  }

  textarea::-webkit-scrollbar-thumb:hover {
    background-color: grey !important;
  }

  .title {
    font-family: Roboto, Arial, Helvetica, sans-serif !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    border-radius: 10px 10px 0 0 !important;
    box-sizing: border-box !important;
    position: relative !important;
    width: 100% !important;
    height: 40px !important;
    background-color: ${props => props.color.title} !important;
  }

  .title p {
    display: inline-block !important;
    margin: 10px !important;
  }

  textarea {
    width: 100% !important;
    height: 100% !important;
    box-sizing: border-box !important;
    font-family: Roboto, Arial, Helvetica, sans-serif !important;
    outline: none !important;
    padding: 10px !important;
    background-color: transparent !important;
    border: none !important;
    resize: none !important;
    min-width: 100% !important;
    min-height: 100% !important;
  }
  .icons {
    font-size: 16px !important;
    color: ${props => props.color.text} !important;
  }

  .title .arrow:hover ~ .settings-container {
    left: 0px !important;
  }

  .settings-container:hover {
    left: 0px !important;
  }

  input {
    background-color: transparent !important;
    border: none !important;
    width: calc(100% - 30px) !important;
    height: 100% !important;
    color: ${props => props.color.text} !important;
    padding: 0 10px 0 10px !important;
    box-sizing: border-box !important;
    outline: none !important;
    font-weight: bold !important;
  }

  .body {
    width: 100% !important;
    height: calc(100% - 40px) !important;
  }

  .settings-container {
    position: absolute !important;
    left: 100% !important;
    background-color: inherit !important;
    width: 100% !important;
    transition: 0.3s ease left !important;
    top: 0px !important;
    display: flex !important;
    flex-direction: column !important;
    flex-wrap: wrap !important;
    justify-content: space-evenly !important;
    align-items: center !important;
  }

  .icon-container .icons {
    transition: all 0.1s ease-in-out !important;
  }
  .icon-container .icons:hover {
    transform: scale(1.2) !important;
  }

  .icon-container:hover {
    left: 0px !important;
  }

  .icon-container {
    width: 100% !important;
    height: 40px !important;
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-evenly !important;
    align-items: center !important;
  }
`;
