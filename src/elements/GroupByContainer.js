import styled from "styled-components";

export const GroupByContainer = styled.div`

display:inline

.title{
 font-weight: bold;
 font-size: 20px;
 margin: 0px 0px 10px 0px;
}
.button-container {
    display: flex;
    justify-content: space-evenly;
}

button {
    background-color: white;
    border: none;
    padding: 5px 20px 5px 20px;   
}

button:hover {
    background-color: #d1d1d1;
    border-radius: 10px;
}

.selected {
    background-color: #f1f1f1;
    border-radius: 10px;
}
`