import styled from "styled-components";

export const ColorSwatchContainer = styled.div`

width: 100%;
height: 50px;
background-color: lightgrey;
display: flex;
transition: 0.3s ease left;

.color {
    width: 100%
}

.color:hover{
  filter: brightness(85%)
}
`;
