import styled from "styled-components";

export const SearchBox = styled.div`
  input {
    width: 100%;
    border: none;
    background-color: #f1f1f1;
    color: white;
    font-size: 20px;
    font-weight: bold;
    border-radius: 15px;
    height: 40px;
    outline: none;
    padding: 0 10px;

    &:hover {
      background-color: #d1d1d1;
    }
  
    &:active {
      background-color: #919191;
    }

    &::placeholder {
      color: black;
    }
  }
`;