import styled from "styled-components";

export const GroupByContainer = styled.div`

background-color: #f1f1f1;
border-radius: 15px;

.first-row {
    margin-right: 10px;
}
.row {
    display: flex;
    justify-content: space-evenly;
    align-items: center
}

.button-container {
    display: flex;
    justify-content: space-evenly;
}

.sortOrder {
    width: 1em;
    padding: 6px;
}

.sortOrder:hover {
    background-color: #c1c1c1;
    border-radius: 10px;
}

.selected {
    background-color: #d1d1d1;
    border-radius: 10px;
}`