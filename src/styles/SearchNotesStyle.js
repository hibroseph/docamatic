import styled from "styled-components";
import { THEME } from "../utils/constants";

export const SearchNotes = styled.div`
  .searchbox {
    position: relative;
    width: calc(100% - 20px);
    left: 10px;
    top: 10px;
    box-sizing: border-box;
    border: none;
    background-color: #f1f1f1;
    color: white;
    font-size: 20px;
    font-weight: bold;
    border-radius: 15px;
    padding: 0 10px;
    height: 40px;
    outline: none;
    margin-bottom 20px;
  }

  .searchbox:hover {
    background-color: #d1d1d1;
  }

  .searchbox:active {
    background-color: #919191;
  }
  .searchbox::placeholder {
    color: black;
  }

  .searchresults {
    width: 100%;
    height: calc(100% - 60px);
    overflow: auto;
    background-color: transparent;
  }

  .searchresults::-webkit-scrollbar {
    width: 8px;
  }

  .searchresults::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .searchresults::-webkit-scrollbar-thumb {
    background-color: lightgrey;
    border-radius: 100px;
    transition: all 0.1s ease-in-out;
  }

  .searchresults::-webkit-scrollbar-thumb:hover {
    background-color: grey;
  }
`;
