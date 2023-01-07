import styled from "styled-components";
import ContentEditable from "react-contenteditable";

export const NoteContainer = styled.div`
  width: 100% !important;
  background-color: #f5f5f5 !important;
  border-radius: 10px 10px 0 0 !important;
  box-sizing: border-box !important;
  font-family: Arial, Helvetica, sans-serif !important;
  box-shadow: 0px 4px 17px -5px rgba(0, 0, 0, 0.75) !important;
`;

export const StyledContentEditable = styled(ContentEditable)`
  border: none;
  padding: 5px;
  font-family: Arial, Helvetica, sans-serif !important;
  color: black;
  font-size: ${(props) => (props.textsize != undefined ? textsize : "16")}px !important;
  &:focus {
    outline: none;
  }
`;

export const TitleBar = styled.div`
    font-family: Arial, Helvetica, sans-serif !important;
    display: flex !important;
    font-size: 16px !important;
    flex-direction: row !important;
    align-items: center !important
    justify-content: space-between;
    border-radius: 10px 10px 0 0 !important;
    box-sizing: border-box !important;
    position: relative !important;
    width: 100% !important;
    height: 40px !important;
    background-color: ${(props) => props.color.title} !important;

    .icons {
        width: 20px;
        color: ${(props) => props.color.text};
    }

    .icons:hover {
        transform: scale(1.2) !important;
    }
    
    input {
        background-color: transparent !important;
        border: none !important;
        width: calc(100% - 30px) !important;
        height: 100% !important;
        color: ${(props) => props.color.text} !important;
        padding: 0 10px 0 10px !important;
        box-sizing: border-box !important;
        outline: none !important;
        font-weight: bold !important;
      }

    input::placeholder {
      color: ${props => props.color.text};
      opacity:0.5;
    }
`;

export const SettingsToggle = styled.span`
  margin-right: 13px;
  width: 6px;

  #settings-container-toggle {
    color: ${(props) => props.color} 
  }
`;

export const SettingsContainer = styled.div`
  visibility: hidden;
  opacity: 0;
  position: absolute;
  z-index: 50;
  top: 0px;
  left: 0px;
  width: 100%;
  background-color: ${(props) => props.color.title};
  transition: visibility 0s, opacity 0.2s linear;
  border-radius: 10px 10px 0 0 !important;

  ${SettingsToggle}:hover ~ & {
    visibility: visible;
    opacity: 1;
  }

  &:hover {
    visibility: visible;
    opacity: 1;
  }
`;

export const SettingsIconContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 40px;
`;

export const SyncErrorBox = styled.div`
  background-color: #E53C3C;
  color: white;
  margin:5px;
  padding: 10px;
  border-radius: 10px;
  
  display: flex;
  flex-direction: column;  
  h3 {
    margin: 0px;
  }
`

export const ReloadPageButton = styled.button`
  background-color: white;
  color: #e53c3c;
  font-weight: bold;
  font-size: 16px;
  border: none;
  border-radius: 7px;
  padding: 10px;
  box-shadow: 0px 2px 5px rgb(0 0 0 / 20%);
`
