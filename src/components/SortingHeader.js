import React from 'react'
import { GroupByContainer } from "../elements/GroupByContainer";
import {
    faSortAlphaDown,
    faSortAlphaUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "../../node_modules/@fortawesome/react-fontawesome/index";

export const SortingHeader = props =>
    <GroupByContainer>
        <p className="title">Sort By</p>
        <div className="button-container">
            <button onClick={() => props.handleClick('url')} className={props.groupBy == 'url' ? "selected" : ""}>Url</button>
            <button onClick={() => props.handleClick('date')} className={props.groupBy == 'date' ? "selected" : ""}>Date</button>
        </div>
        {props.sortType == 'ascending' && <FontAwesomeIcon icon={faSortAlphaDown} className="sortOrder" onClick={props.handleToggleSortOrder}></FontAwesomeIcon>}
        {props.sortType == 'descending' && <FontAwesomeIcon icon={faSortAlphaUp} className="sortOrder" onClick={props.handleToggleSortOrder}></FontAwesomeIcon>}
    </GroupByContainer>