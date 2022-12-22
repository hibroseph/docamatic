import React from "react";
import { FontAwesomeIcon } from "../../../../node_modules/@fortawesome/react-fontawesome/index";
import { faAngleRight, faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { CreateFriendlyPreviewUrl } from "../../../utils/CreateFriendlyPreviewUrl";
import Note from "../../Note/Note";
import { NotePadding } from "../style";
import { NoRenderErrorBoundary } from "../../NoRenderErrorBoundary";

const getSortedArrayWithUrl = (pages, sortingType) => {
  return Object.keys(pages).sort((a, b) => sortingType(CreateFriendlyPreviewUrl(a), CreateFriendlyPreviewUrl(b)));
};
export const SortNotesByUrl = (props) => (
  <div className="filter-results">
    {getSortedArrayWithUrl(props.pages, props.getSortingFunction()).map((key) => {
      if (key != 'tags' && props.pages[key].notes.length > 0) {
        return (
          <div key={key}>
            <div className="url-selector" onClick={() => props.handleTogglingNotes(key)}>
              {props.expandTabs.includes(key) ? (
                <FontAwesomeIcon className="caret-icon" icon={faAngleDown}></FontAwesomeIcon>
              ) : (
                <FontAwesomeIcon className="caret-icon" icon={faAngleRight}></FontAwesomeIcon>
              )}
              <h3 style={{ display: "inline" }}>{CreateFriendlyPreviewUrl(key)}</h3>
            </div>
            
            {props.expandTabs.includes(key) && (
              <div>
                {props.pages[key].notes.map((note) => {
                  return (
                    <NoRenderErrorBoundary key={note.id}>
                      <NotePadding>
                        <Note key={note.id} 
                        popup={true} 
                        disableClick={true}
                        {...note} 
                        url={key} 
                        previewText={CreateFriendlyPreviewUrl(key)}
                        tags={props.tags.filter(tag => tag.notes.includes(note.id))}
                        ></Note>
                      </NotePadding>
                    </NoRenderErrorBoundary>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
    })}
  </div>
);
