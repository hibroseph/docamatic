import React, {useState} from "react";
import styled from "styled-components";
import { getContrastingColor } from "../../utils/ContrastingColor"
import {faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TagSpan = styled.span`
    border-radius: 10px;
    background-color: ${props => props.color};
    color: ${props => getContrastingColor(props.color)};
    padding: 2px 5px;
    margin: 2px;
    font-size: 12px;
    &:hover {
        filter: brightness(85%);
    }
`

const onTagClick = (tagText, setTagText, removeTag) => {
    console.debug("you clicked the tag")
    console.debug(tagText)
    if (tagText == 'add tag') {
        console.debug("the tag text is add tag")
        setTagText('');
    } else {
        console.debug("we are removing the tag")
        removeTag();
    }
}

const determineIcon = (icon) => {
    switch(icon) {
        case "add":
            return faPlus;
        case "remove":
            return faMinus;
        default:
            throw new Error(`${icon} is not a registered valid icon for bubble tags`)
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