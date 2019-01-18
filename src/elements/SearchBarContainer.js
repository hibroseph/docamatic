import styled from "styled-components"

export const SearchBarContainer = styled.div`
input {
    position: absolute;
    width: 180px;
    display: block;

    top: 60px;

    color: white;
    font-size: 15px;

    background-color: #0f99dc;
    border: none;
    padding: 10px;

    margin-top: 5px;
    margin-bottom: 5px;
    margin-left: 10px;
    margin-right:10px;
}

.search_query_input {
    border-radius:5px;
    transition: all 0.3s ease;
}

.search_query_input:hover {
    /* border: 3px solid; */
    border-color: #2193ca;
     
}

.search_query_input::placeholder {
    color: white;
    font-size: 15px;
}`
