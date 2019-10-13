import styled from "styled-components";
import { THEME } from "../utils/constants";

export const SearchNotes = styled.div`
  .searchbox {
    position: absolute;
    width: calc(100% - 20px);
    left: 10px;
    top: 10px;
    box-sizing: border-box;
    border: none;
    background-color: ${THEME.Primary};
    color: white;
    font-size: 20px;
    font-weight: bold;
    border-radius: 15px;
    padding: 0 10px;
    height: 40px;
    outline: none;
  }

  .searchbox:hover {
    background-color: ${THEME.Accent};
  }

  .searchbox:active {
    background-color: ${THEME.Active};
  }
  .searchbox::placeholder {
    color: white;
  }

  .searchresults {
    position: absolute;
    top: 60px;
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
