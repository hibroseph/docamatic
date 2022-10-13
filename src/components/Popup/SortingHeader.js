import React, { useState } from 'react'
import { GroupByContainer } from "../../elements/GroupByContainer";
import {
    faSortAlphaDown,
    faSortAlphaUp,
    faSort
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DocamaticButton } from "../../elements/DocamaticButton";
import { DateGroupByMenu } from "../../elements/DateGroupByMenu";
import useComponentVisible from "../../utils/useComponentVisible";
import { PageTitle } from "./style"

const DetermineSelectedGroupByButton = (groupedByKey, key) => {
    if (key == groupedByKey) {
        return 'selected';
    } else {
        return '';
    }
}
export const SortingHeader = props => {
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
    return (<div>
        <GroupByContainer>
            <div className="row first-row">
                <PageTitle>Sort By</PageTitle>
                <div className="button-container">
                    <DocamaticButton onClick={() => props.handleClick('url')} className={props.groupBy == 'url' ? "selected" : ""}>Url</DocamaticButton>
                    <DocamaticButton onClick={() => props.handleClick('date')} className={props.groupBy == 'date' ? "selected" : ""}>Date</DocamaticButton>
                </div>
                {props.sortType == 'ascending' && <FontAwesomeIcon icon={faSortAlphaDown} className="sortOrder" onClick={props.handleToggleSortOrder}></FontAwesomeIcon>}
                {props.sortType == 'descending' && <FontAwesomeIcon icon={faSortAlphaUp} className="sortOrder" onClick={props.handleToggleSortOrder}></FontAwesomeIcon>}
                {props.groupBy == 'date' && <FontAwesomeIcon icon={faSort} className={`sortOrder ${isComponentVisible ? "selected" : ""}`} onClick={() => setIsComponentVisible(!isComponentVisible)}></FontAwesomeIcon>}
            </div>
        </GroupByContainer>
        {
            isComponentVisible && <DateGroupByMenu ref={ref}>
                <div className="title">Group By</div>
                <DocamaticButton onClick={() => props.handleDateGroupingKey('second')} className={DetermineSelectedGroupByButton(props.dateGroupingKey, 'second')}>Seconds</DocamaticButton>
                <DocamaticButton onClick={() => props.handleDateGroupingKey('minute')} className={DetermineSelectedGroupByButton(props.dateGroupingKey, 'minute')}>Minutes</DocamaticButton>
                <DocamaticButton onClick={() => props.handleDateGroupingKey('hour')} className={DetermineSelectedGroupByButton(props.dateGroupingKey, 'hour')}>Hours</DocamaticButton>
                <DocamaticButton onClick={() => props.handleDateGroupingKey('day')} className={DetermineSelectedGroupByButton(props.dateGroupingKey, 'day')}>Days</DocamaticButton>
            </DateGroupByMenu>
        }
    </div>)
}