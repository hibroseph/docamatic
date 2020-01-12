import styled from "styled-components";

export const FilterNotes = styled.div`
  .label {
    margin-left: 12px;
    color: grey;
    font-weight: bold;
    font-size: 10px;
  }

  .filter-results {
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: transparent;
  }

  .filter-results::-webkit-scrollbar {
    width: 8px;
  }

  .filter-results::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .filter-results::-webkit-scrollbar-thumb {
    background-color: lightgrey;
    border-radius: 100px;
    transition: all 0.1s ease-in-out;
  }

  .filter-results::-webkit-scrollbar-thumb:hover {
    background-color: grey;
  }
`;
