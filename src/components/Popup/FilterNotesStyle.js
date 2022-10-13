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
    background-color: transparent;
  }

  .url-selector {
    padding: 2px;
    margin: 5px 0px 5px 0px
    word-break: break-all
  }
  .url-selector:hover {
    background-color: #f1f1f1
    border-radius: 5px;
  }

  .caret-icon {
    display: inline;
    margin-right: 10px;
  }
`;
