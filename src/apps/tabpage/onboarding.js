import React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import docamaticLogo from "../../../images/docamatic-logo.png"
import docamaticTextLogo from "../../../images/docamatic-text-logo.png"
import step1Gif from "../../assets/onboarding/step1.gif"
import step2Gif from "../../assets/onboarding/step2.gif"
import step3Gif from "../../assets/onboarding/step3.gif"
import step4Gif from "../../assets/onboarding/step4.gif"
import step4Gif from "../../assets/onboarding/step5.gif"

const Header = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .title {
        font-size: 80px;
        font-weight:bold;
    }

    .docamatic-image {
        padding: 15px;
    }
`
const Background = styled.div`
    background-image: radial-gradient(rgba(83,158,227,0.7),rgba(83,158,227,1));
    display: flex;
    flex-direction: column;
    align-items: center;
`

const Step = styled.div`
    display: flex;
    align-items: flex-start;
    padding: 10px;
    margin: 10px;
    .step-number {
        font-size: 80px;
        font-weight: bold;
        color: black;
    }

    .step-text {
        font-size: 35px;
        font-weight: bold;
        color: black;
    }
`

const StepDescription = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
        width: 50%;
    }
`

const TutorialSteps = styled.div`
    display: flex;
    flex-direction: column;
`
const Onboarding = ( props ) => {
        return (
        <Background>
            <Header>
                <div>
                    <img className="docamatic-image" src={docamaticLogo}></img>
                    <img className="docamatic-image" src={docamaticTextLogo}></img>
                </div>
                <h1 className="title">Tutorial</h1>
            </Header>
            <TutorialSteps>
            <Step>
                <h1 className="step-number">1.</h1>
                <StepDescription>
                    <p className="step-text">Go to a website you’d like to add a note to (for example wikipedia.com)</p>
                    <img src={step1Gif}></img>
                </StepDescription>
            </Step>
            <Step>
                <h1 className="step-number">2.</h1>
                <StepDescription>
                    <p className="step-text">Click the Docamatic chrome extension in the top right to open the popup</p>
                    <img src={step2Gif}></img>
                </StepDescription>
            </Step>
            <Step>
                <h1 className="step-number">3.</h1>
                <StepDescription>
                    <p className="step-text">Click the “Add Note button” at the top of the popup</p>
                    <img src={step3Gif}></img>
                </StepDescription>
            </Step>
            <Step>
                <h1 className="step-number">4.</h1>
                <StepDescription>
                <p className="step-text">Edit the notes title and body and change its position till your hearts content</p>
                <img src={step4Gif}></img>
                </StepDescription>
            </Step>
            <Step>
                <h1 className="step-number">5.</h1>
                <StepDescription>
                <p className="step-text">You can heart notes, change note colors and delete notes</p>
                <img src={step5Gif}></img>
                </StepDescription>
            </Step>
            </TutorialSteps>
        </Background>)
    }

let element = document.getElementById("__tabpage_mount_point__")

ReactDOM.render(<Onboarding></Onboarding>, element);