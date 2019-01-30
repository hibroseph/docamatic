import styled from "styled-components";

export const SearchResultsContainer = styled.div`

position: absolute;
top: 195px;
width: 100%;

#note-scroll-list{
    position: absolute;
    /* background-color: #d0dadf; */
    background-color: black;
    border-radius: 3px;
    top: 195px;
    margin: 5px;
    height: 270px;
    overflow-y: auto;
    
}

#search-preview {
    font-size: 23px;
    position: absolute;
    top: 50px;
    color: #7b96a3;
    font-weight: bold;
}
`