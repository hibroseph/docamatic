import React from 'react'
import { GroupByContainer } from "../elements/GroupByContainer";
import {
    faSortAlphaDown,
    faSortAlphaUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "../../node_modules/@fortawesome/react-fontawesome/index";

export const SortingHeader = props =>
    <GroupByContainer>
        <div className="row first-row">
            <p className="title">Sort By</p>
            <div className="button-container">
                <button onClick={() => props.handleClick('url')} className={props.groupBy == 'url' ? "selected" : ""}>Url</button>
                <button onClick={() => props.handleClick('date')} className={props.groupBy == 'date' ? "selected" : ""}>Date</button>
            </div>
            {props.sortType == 'ascending' && <FontAwesomeIcon icon={faSortAlphaDown} className="sortOrder" onClick={props.handleToggleSortOrder}></FontAwesomeIcon>}
            {props.sortType == 'descending' && <FontAwesomeIcon icon={faSortAlphaUp} className="sortOrder" onClick={props.handleToggleSortOrder}></FontAwesomeIcon>}
        </div>
        {/*
        <div>
            <p>Group By</p>
            {props.groupBy == 'date' &&
                <select name="group dates" value={props.dateGroupingKey} onChange={props.handleDateGroupingKey}>
                    <option value="second">Seconds</option>
                    <option value="minute">Minutes</option>
                    <option value="hour">Hours</option>
                    <option value="day">Days</option>
                </select>}
        </div>
         */}
    </GroupByContainer>