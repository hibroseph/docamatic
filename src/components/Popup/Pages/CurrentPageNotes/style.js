import styled from 'styled-components'

export const NotValidWebpage = styled.div`
    display:flex;
    flex-direction: column
    align-items:center;
`

export const NoteList = styled.div`
.title {
    font-weight: bold;
    font-size: 20px;
    margin: 10px 5px 0px 10px;
}
`

export const NotePadding = styled.div`
    padding: 5px 0;
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

export const MessageHeader = styled.p`
    font-size: 15px;
    font-weight: ${props => props.bold ? "bold" : ""}
`

export const SubMessage = styled.p`
    font-size: 12px
    
`

export const Image = styled.img`
    width: 200px; 
    height: auto;
`

export const Link = styled.a`
    color: #000000; 
    text-decoration: none;
`