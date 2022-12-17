import React, { useState } from "react";
import { connect } from "react-redux";
import search_hint from "../../../assets/search_results.png";
import no_results from "../../../assets/no_results.png";
import FilterNotes from "./FilterNotes";
import { SearchBox } from "../SearchBox";

export const SearchNotes = (props) => {

  const [searchQuery, setSearchQuery] = useState({ text: null, tags: []});

    return (
      <div>
        <SearchBox 
          onSearch={(searchQuery) => {
            setSearchQuery(searchQuery)
            console.debug("search query");
            console.debug(searchQuery);
          }}
          availableTags={props.tags}
          />
        {!searchQuery && (
          <img
            src={search_hint}
            style={{ marginLeft: 10, marginTop: 100 }}
          ></img>
        )}
        <FilterNotes
          filter={note => {
            // The searching lambda
            if (searchQuery.text || searchQuery.tags.length != 0) {
              return (
                ((note.title != null && searchQuery.text && searchQuery.text != "" &&
                note.title
                  .toLowerCase()
                  .includes(searchQuery.text.toLowerCase())) ||
                (note.body != null && searchQuery.text && searchQuery.text != "" &&
                  note.body
                  .toLowerCase()
                  .includes(searchQuery.text.toLowerCase())) || searchQuery.text == '' || !searchQuery.text)
                  && (searchQuery.tags.length > 0 ?
                  ( note.tags ? (note.tags.filter(p => searchQuery.tags.map(t => t.id).includes(p.id)).length) == searchQuery.tags.length : false) : true)
              );
            }
          }}
          noResultsImg={searchQuery.text || searchQuery.tags.length != 0 ? no_results : null}
        />
      </div>
    );
}

export default connect(
  state => {
    return { notes: state.pages,
    tags: state.tags };
  },
  null
)(SearchNotes);
