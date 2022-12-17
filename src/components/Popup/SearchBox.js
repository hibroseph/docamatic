import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import { TagBubble } from '../TagBubble/TagBubble'
import { TagBubbleContainer } from '../TagBubble/TagBubbleContainer'

export const SearchInput = styled.input`
    width: 100%;
    height: 50px;
    background-color: e1e1e1;
    border-radius: 10px;
    color: #767676;
    font-size: 30px;
    border: none;
    padding: 10px;
    font-weight: bold;`

export const SearchContainer = styled.div`
    background-color: #e1e1e1;
    border-radius: 10px;
`

export const SearchBox = (props) => {

    const [searchQuery, setSearchQuery] = useState({text: null, tags: []})

    const [availableTags, setAvailableTags] = useState(props.availableTags)

    useEffect(() => {
        console.debug("search query changed")
        props.onSearch(searchQuery)
    }, [searchQuery])

    return (
    <div>
        <SearchContainer>
        <SearchInput onChange={event => setSearchQuery({text: event.target.value, tags: searchQuery.tags})} placeholder="Search Notes"></SearchInput>
        <TagBubbleContainer style={{padding: "5px"}}>
            {searchQuery.tags.map(tag => 
                <TagBubble 
                key={tag.id}
                text={tag.text} 
                color={tag.color}
                 removeTag={() => {
                    setAvailableTags([...availableTags, tag])
                    setSearchQuery({text: searchQuery.text, tags: searchQuery.tags.filter(p => p.id != tag.id)})
                }}/>
            )}
        </TagBubbleContainer>
    </SearchContainer>
    <TagBubbleContainer style={{ padding: "5px"}}>
        {availableTags.map(tag => 
            <TagBubble 
            key={tag.id}
            text={tag.text} 
            color={tag.color}
            removeTag={() => {
                setAvailableTags(availableTags.filter(p => p.id != tag.id))
                setSearchQuery({ text: searchQuery.text, tags: [...searchQuery.tags, tag]})
            }} />)}
    </TagBubbleContainer>
    </div>)
} 