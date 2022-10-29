import React, {useState} from "react";
import styled from "styled-components";
import { getContrastingColor } from "../utils/ContrastingColor"

const TagSpan = styled.span`
    border-radius: 10px;
    background-color: ${props => props.color};
    color: ${props => getContrastingColor(props.color)};
    padding: 2px 5px;
    margin-left: 2px;
    font-size: 12px;
    &:hover {
        filter: brightness(85%);
    }
`

const onTagClick = (tagText, setTagText, removeTag) => {
    if (tagText == 'add tag') {
        setTagText('');
    } else {
        removeTag();
    }
}

export const TagBubble = (props) => {
    const [tagText, setTagText] = useState(props.text);

    return <TagSpan 
    onClick={() => onTagClick(tagText, setTagText, props.removeTag)}
    contentEditable={props.contentEditable ? true : false}
    suppressContentEditableWarning={props.contentEditable ? true : false}
    onKeyDown={(key) => {
        if (key.keyCode == 13 && 
            key.currentTarget.textContent != 'add tag' && 
            key.currentTarget.textContent != '') {
                key.preventDefault();
        props.createTag(key.currentTarget.textContent)
        setTagText("add tag")
        key.currentTarget.blur();
        }
    
        if (key.keyCode == 13) {
            key.preventDefault();
            setTagText("add tag");
            key.currentTarget.blur();
        }
    
        key.stopPropagation()}
    }
    onBlur={blur => {
        if (blur.currentTarget.textContent != 'add tag' && blur.currentTarget.textContent != '') {
            props.createTag(blur.currentTarget.textContent);
            blur.currentTarget.blur();
        }

        setTagText("add tag")
        blur.stopPropagation()}}
    onKeyUp={event => event.stopPropagation()}
    {...props}
    >{tagText}</TagSpan>
}