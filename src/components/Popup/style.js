import styled from "styled-components";

export const PopupStyle = styled.div`
  background-color: lightgrey;
  width: 100%;
  height: 100%;
  display: flex;
`;

export const PopupContentStyle = styled.div`
  height: 100%;
  width: 330px;
  background-color: white;
  overflow-y: auto;
  padding: 5px 10px 5px 10px;
  box-sizing: border-box;
  
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: lightgrey;
    border-radius: 100px;
    transition: all 0.1s ease-in-out;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: grey;
  }
`;

export const NotePadding = styled.div`
    padding: 5px 0;
`

export const PreviewUrl = styled.a`
  margin: 2px 0;
  text-decoration: none;
  color: black;
  padding: 2px;
  display: block;

  &:visited {
    color: black;
  }

  &:hover {
    background-color: lightgrey;
    border-radius: 5px;
  }
`
export const PageTitle = styled.p`
  font-weight: bold;
  font-size: 20px;
  margin: 10px 0;
`