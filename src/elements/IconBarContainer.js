import styled from "styled-components";

export const IconBarContainer = styled.div`
.icon-bar {
    width: 100%;
    background-color: #555;
    overflow: auto;
}

.icon-bar a {
    float: left;
    text-align: center;
    width:50%;
    padding: 10px 0;
    transition: all 0.3s ease;
    color: white;
    font-size: 14px;
}

.icon-bar-item:hover {
    background-color: #000;
}

.icon-bar-item {
    float: left;
    text-align: center;
    width:100%;
    padding: 10px 0;
    transition: all 0.3s ease;
    color: white;
    font-size: 14px;
}

.active {
    background-color: #4CAF50;
}
`;
