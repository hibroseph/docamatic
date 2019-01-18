import styled from "styled-components";

export const IconBarContainer = styled.div`
  .icon-bar {
    position: relative;
    width: 100%;
    height: 40px;
    

    /* overflow: auto; */
  }

  .icon-bar a {
    float: left;
    text-align: center;
    width: 50%;
    padding: 10px 0;
    transition: all 0.3s ease;
    color: white;
    font-size: 14px;
  }

  .icon-bar-item:hover {
    background-color: #2193ca;
  }

  .icon-bar-item {
    position: absolute;
    background-color: #0f99dc;
    border-radius: 25px;


    text-align: center;
    /* width: 100%; */
    width: 150px;
    padding: 10px 0;
    
    transition: all 0.3s ease;
    color: white;
    font-size: 14px;
    
    margin-left:25px;
    margin-top: 10px;
  }

  .active {
    background-color: #4caf50;
  }
`;
