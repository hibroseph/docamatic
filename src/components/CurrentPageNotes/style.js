import styled from 'styled-components'

export const NotValidWebpage = styled.div`
    display:flex;
    flex-direction: column
    align-items:center;

    img {
        margin-top: 20px;
        width: 300px; 
        height: auto;
    }
`

export const NoteList = styled.div`
.title {
    font-weight: bold;
    font-size: 20px;
    margin: 10px 5px 0px 10px;
}
`

export const CreateNewNote = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
        width: 300px;
    }

    button {
        border: none;
        padding: 20px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
    }
`

export const Message = styled.p`
    font-size: 15px;
    font-weight: ${props => props.bold ? "bold" : ""}
`