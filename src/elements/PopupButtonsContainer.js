import styled from "styled-components";

export const PopupButtonsContainer = styled.div`
  position: absolute;
  background-color: #0082c8;
  height: 190px;
  width: 100%;

  .button {
    position: relative;
    background-color: #0070ac;
    width: 200px;
    padding: 15px;
    margin-top: 20px;
    margin-right: 30px;
    margin-left: 30px;

    border-radius: 20px;
    color: white;
    font-size: 20px;
    /* font-weight: bold; */
    text-align: center;
  }

  .button:hover {
    background-color: #004f79;
  }

  .input {
    position: relative;
    background-color: #0070ac;
    margin-top: 20px;
    margin-right: 30px;
    margin-left: 30px;
    border-radius: 20px;
    border-style: none;
    width: 230px;
    font-size: 20px;
    text-align: center;
    padding: 18px;
    color: white;
  }

  .input::placeholder {
    color: white;
    width: 250px;
  }

  .input:hover {
      background-color: #004f79;
  }
`;
