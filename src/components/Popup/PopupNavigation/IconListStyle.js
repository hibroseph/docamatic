import styled from "styled-components";
import { THEME } from "../../../utils/constants";

export const IconListStyle = styled.div`
  width: 70px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${THEME.Primary};

  .icon {
    width: 100%;
    padding: 25 0;
    font-size: 30px;
    color: white;
  }

  .selected {
    background-color: #0b7bad;
  }
  
  .icon:hover {
    background-color: ${THEME.Accent};
  }

  .icon:active {
    background-color: ${THEME.Active};
  }
`;
