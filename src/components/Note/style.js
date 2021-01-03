import styled from 'styled-components'

export const NoteContainer = styled.div`
    position: absolute !important;
    width: 100% !important;
    background-color: #f5f5f5 !important;
    border-radius: 10px 10px 0 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    font-family: Arial, Helvetica, sans-serif !important;
    box-shadow: 0px 4px 17px -5px rgba(0, 0, 0, 0.75) !important;
`

export const TitleBar = styled.div`
    font-family: Roboto, Arial, Helvetica, sans-serif !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    border-radius: 10px 10px 0 0 !important;
    box-sizing: border-box !important;
    position: relative !important;
    width: 100% !important;
    height: 40px !important;
    background-color: ${props => props.color.title} !important;

    .icons {
        color: ${props => props.color.text}
    }

    .icons:hover {
        transform: scale(1.2) !important;
    }
    
    input {
        background-color: transparent !important;
        border: none !important;
        width: calc(100% - 30px) !important;
        height: 100% !important;
        color: ${props => props.color.text} !important;
        padding: 0 10px 0 10px !important;
        box-sizing: border-box !important;
        outline: none !important;
        font-weight: bold !important;
      }
`

export const SettingsToggle = styled.span`

`

export const SettingsContainer = styled.div`
    display: none;
    position: absolute;
    z-index: 50;
    top: 0px;
    left: 0px;
    width: 100%;

    ${SettingsToggle}:hover & {
        display: block;
    }
`

export const SettingsIconContainer = styled.div`
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 40px;
`