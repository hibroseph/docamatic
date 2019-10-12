import styled from "styled-components";

export const IconListStyle = styled.div`
  width: 70px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #245f88;

  .icon {
    width: 100%;
    padding: 25 0;
    font-size: 30px;
    color: white;
  }

  .icon:hover {
    background-color: #21aae3;
  }

  .icon:active {
    background-color: #178aba;
  }
`;
