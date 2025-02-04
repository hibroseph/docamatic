import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight, faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { CreateFriendlyDate } from "../../../utils/CreateFriendlyDate";
import Note from "../../Note/Note";
import { NotePadding } from "../style";
import { NoRenderErrorBoundary } from "../../NoRenderErrorBoundary";

const getGroupingDateKey = (groupByDate, date) => {
  let date = new Date(date);
  switch (groupByDate) {
    case "day":
      date.setSeconds(0, 0);
      date.setMinutes(0, 0);
      date.setHours(0, 0);
    case "hour":
      date.setMinutes(0, 0);
      date.setSeconds(0, 0);
      return date.valueOf();
    case "minute":
      date.setSeconds(0, 0);
      return date.valueOf();
    case "second":
      return date.valueOf();
  }
};

const getArraySortedWithDates = (pages, sortType, groupingKey) => {
  let newArray = {};

  Object.keys(pages).map((key) => {
    pages[key].notes.map((note) => {
      if (newArray[getGroupingDateKey(groupingKey, note.date_created)] == undefined) {
        newArray[getGroupingDateKey(groupingKey, note.date_created)] = [{ ...note, url: key }];
      } else {
        newArray[getGroupingDateKey(groupingKey, note.date_created)].push({ ...note, url: key });
      }
    });
  });
  return Object.keys(newArray)
    .sort(sortType)
    .map((key) => Object.assign({}, { date: key }, { notes: newArray[key] }));
};

export const SortNotesByDate = (props) => (
  <NoRenderErrorBoundary className="filter-results">
    {getArraySortedWithDates(props.pages, props.getSortingFunction(), props.groupingKey).map((noteGroup, i) => {
      return (
        <NoRenderErrorBoundary key={i}>
          <div className="url-selector" onClick={() => props.handleTogglingNotes(noteGroup.date)}>
            {props.expandTabs.includes(noteGroup.date) ? (
              <FontAwesomeIcon className="caret-icon" icon={faAngleDown}></FontAwesomeIcon>
            ) : (
              <FontAwesomeIcon className="caret-icon" icon={faAngleRight}></FontAwesomeIcon>
            )}
            <h3 style={{ display: "inline" }}>{CreateFriendlyDate(noteGroup.date, props.groupingKey)}</h3>
          </div>
          {noteGroup.notes.map((note, b) => {
            return (
              <div key={note.id}>
                {props.expandTabs.includes(noteGroup.date) && (
                  <NoRenderErrorBoundary>
                    <NotePadding>
                      <Note
                      hello={a+a}
                      popup={true} 
                      disableClick={true}
                      {...note} 
                      website={note.url}
                      tags={props.tags.filter(tag => tag.notes.includes(note.id))}
                      ></Note>
                    </NotePadding>
                  </NoRenderErrorBoundary>
                )}
              </div>
            );
          })}
        </NoRenderErrorBoundary>
      );
    })}
  </NoRenderErrorBoundary>
);
