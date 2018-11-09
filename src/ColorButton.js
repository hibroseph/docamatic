import React, { Component } from 'react'
import styled, { css } from "styled-components";

class ColorButton extends Component {

    render() {
        console.log("The color button is rendering")

        // render the button
        return (
            <div style={{ display: "inline-block", paddingRight: "10px" }}>

                <Button>Color</Button>

                <Container>Hello</Container>
            </div>
        )
    }
}



const ColorChooser = styled.div`
    width:250px
    height: 50px;
    background-color: white;
    border-radius: 8px;
    position: absolute;
    visibility: hidden;

`

const Button = styled.button`
    background-color: #4caf50;
    color: white;
    padding: 12px;
    padding-top: 6px;
    padding-bottom: 6px;
    font-size: 16px;
    border-radius: 7px;
    border: none;

    &:hover {
        background-color: #3c8c40;
    }
`;


const Container = styled.div`
    height: 50px;
    width: 250px;
    padding: 3px;
    background-color:#FFFFFF;
    border-radius: 6px;
    border-color: #000000;
    border-width: 2px;
    border-style: solid;
    position: absolute;
    visibility: hidden;

    .dropbtn {
        
    }
`;

export default ColorButton