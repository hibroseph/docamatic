import styled from 'styled-components'
import { DocamaticButton } from './DocamaticButton';

export const DateGroupByMenu = styled.div`
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: #f1f1f1;
    border-radius: 15px;
    margin-top: 5px;
    right: 10px;
    z-index:5;
    ${DocamaticButton} {
        padding: 5px;
        margin: 5px; 
    }

    .title {
        padding: 5px;
        margin: 2px 5px 2px 5px;
        font-weight: bold;
    }
`