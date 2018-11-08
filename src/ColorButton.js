import React, { Component } from 'react'
import styled from "styled-components";

class ColorButton extends Component {

    render() {
        console.log("The color button is rendering")

        // render the button
        return (
            <button>Color Button</button>
        )
    }
}

const Container = styled.div`
    height: 20px;
    width: 100px;
    padding: 3px;
    background:blue;
    display: inline-block;
`;

export default ColorButton