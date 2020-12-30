import React from 'react';
import { FontAwesomeIcon } from "../../node_modules/@fortawesome/react-fontawesome/index";
import {
    faAngleRight,
    faAngleDown
} from "@fortawesome/free-solid-svg-icons";
import { CreateFriendlyDate } from "../utils/CreateFriendlyDate";
import MiniSearchNote from "../components/MiniSearchNote";

const getArraySortedWithDates = (pages, sortType) => {
    let newArray = {};

    Object.keys(pages).map(key => {
        pages[key].notes.map(note => {
            newArray[note.date_created] = { ...note, url: key };
        })
    })
    return Object.keys(newArray).sort(sortType).map(key => newArray[key]);
}

export const SortNotesByDate = props =>
    <div className="filter-results">
        {getArraySortedWithDates(props.pages, props.getSortingFunction()).map(note => {
            return (
                <div>
                    <div className="url-selector" onClick={() => props.handleTogglingNotes(note.id)}>
                        {props.expandTabs.includes(note.id) ? <FontAwesomeIcon className="caret-icon" icon={faAngleDown}></FontAwesomeIcon>
                            : <FontAwesomeIcon className="caret-icon" icon={faAngleRight}></FontAwesomeIcon>}
                        <h3 style={{ display: "inline" }}>{CreateFriendlyDate(note.date_created)}</h3>
                    </div>
                    {
                        props.expandTabs.includes(note.id) && <MiniSearchNote {...note} website={note.url}></MiniSearchNote>
                    }
                </div>
            )
        })}
    </div>