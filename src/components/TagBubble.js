import React, {useState} from "react";
import styled from "styled-components";
import { getContrastingColor } from "../utils/ContrastingColor"
import { LightenColor } from "../utils/LightenColor"


const TagSpan = styled.span`
    border-radius: 10px;
    background-color: ${props => props.color};
    color: ${props => getContrastingColor(props.color)};
    padding: 2px 5px;
    font-size: 12px;
    margin-left: 3px;
    &:hover {
        filter: brightness(85%);
    }
`

const onTagClick = (tagText, setTagText, removeTag) => {
    if (tagText == 'add tag') {
        console.log("tag got clicked with add tag text, removing tag text")
        setTagText('');
    } else {
        console.log("tag got clicked and we are removing it")
        removeTag();
    }
}

export const TagBubble = (props) => {
    const [tagText, setTagText] = useState(props.text);

    console.log("tag bubble props")
    console.log(props)

    return <TagSpan 
    onClick={() => onTagClick(tagText, setTagText, props.removeTag)}
    contentEditable={props.contentEditable ? true : false}
    suppressContentEditableWarning={props.contentEditable ? true : false}
    onKeyDown={(key) => {
        if (key.keyCode == 13 && 
            key.currentTarget.textContent != 'add tag' && 
            key.currentTarget.textContent != '') {
                key.preventDefault();
        console.log("creating tag in tag")
        props.createTag(key.currentTarget.textContent)
        setTagText("add tag")
        }
    
        if (key.keyCode == 13) {
            console.log("detected enter, resetting tag text")
            key.preventDefault();
            setTagText("add tag");
        }}}
    onBlur={blur => { 
        if (blur.currentTarget.textContent != 'add tag' && blur.currentTarget.textContent != '') {
            props.createTag(blur.currentTarget.textContent);
        }

        setTagText("add tag")}
    }
    {...props}
    >{tagText}</TagSpan>
}