import styled from "styled-components";

export const ColorSwatchContainer = styled.div`
position: absolute;
width: 100%;
height: 50px
background-color: lightgrey;
display: flex

.color {
    width: 100%
}

.color:hover{
  filter: brightness(85%)
}
`;
