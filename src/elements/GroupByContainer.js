import styled from "styled-components";

export const GroupByContainer = styled.div`

background-color: #f1f1f1;
border-radius: 15px;
display: flex;
justify-content: space-evenly;
align-items: center
height: 40px;
margin-right: 10px;

.title{
 font-weight: bold;
 font-size: 20px;
 margin: 10px 5px 10px 0px;
}

.button-container {
    display: flex;
    justify-content: space-evenly;
}

button {
    border: none;
    border-radius: 10px;
    padding: 5px 20px 5px 20px;   
    margin: 0px 3px 0px 3px;
}

button:hover {
    background-color: #c1c1c1;
    border-radius: 10px;
}

.selected {
    background-color: #d1d1d1;
    border-radius: 10px;
}

.sortOrder {
}
`