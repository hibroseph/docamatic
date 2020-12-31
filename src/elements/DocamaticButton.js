import styled from "styled-components";

export const DocamaticButton = styled.button`
    border: none;
    border-radius: 10px;
    padding: 5px 20px 5px 20px;   
    margin: 0px 3px 0px 3px;
    :hover {
        background-color: #c1c1c1;
        border-radius: 10px;
    }
    &.selected {
        background-color: #d1d1d1;
        border-radius: 10px;
    }
}
`