import styled from "styled-components";
import ContentEditable from "react-contenteditable";

export const NoteContainer = styled.div`
  width: 100% ;
  background-color: #f5f5f5;
  border-radius: 10px 10px 0 0 ;
  box-sizing: border-box ;
  font-family: Arial, Helvetica, sans-serif ;
  box-shadow: 0px 4px 17px -5px rgba(0, 0, 0, 0.75);
`;

export const StyledContentEditable = styled(ContentEditable)`
  border: none;
  padding: 5px;
  font-family: Arial, Helvetica, sans-serif ;
  color: black;
  font-size: ${(props) => (props.textsize != undefined ? textsize : "16")}px ;
  &:focus {
    outline: none;
  }
`;

export const TitleBar = styled.div`
    font-family: Arial, Helvetica, sans-serif;
    display: flex ;
    font-size: 16px;
    flex-direction: row;
    align-items: center ;
    justify-content: space-between;
    border-radius: 10px 10px 0 0 ;
    box-sizing: border-box ;
    position: relative;
    width: 100% ;
    height: 40px;
    background-color: ${(props) => props.color.title} ;

    .icons {
        width: 20px;
        color: ${(props) => props.color.text};
    }

    .icons:hover {
        transform: scale(1.2);
    }
    
    input {
        background-color: transparent ;
        border: none ;
        width: calc(100% - 30px) ;
        height: 100% ;
        color: ${(props) => props.color.text} ;
        padding: 0 10px 0 10px ;
        box-sizing: border-box ;
        outline: none ;
        font-weight: bold ;
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
  border-radius: 10px 10px 0 0 ;

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
