import styled from "styled-components";

export const NoteContainer = styled.div`
  overflow: visible;

  .note {
    position: absolute;
    width: 100%;
    height: 100%;

    background-color: #f4f4f4;
    
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;

    resize: both;
    overflow: auto;

    min-width: 100px;
    min-height: 100px;
    -webkit-box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
    -moz-box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
    box-shadow: 5px 5px 38px 1px rgba(0, 0, 0, 0.51);
  }


`;
