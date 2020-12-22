import React, { Component } from "react";
import CurrentlyBuilding from "../assets/CurrentlyBuilding.png";
import { connect } from "react-redux";
import { SortNotesFactory } from "../utils/SortNotes";
// import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import { FilterNotes as Container } from "../styles/FilterNotesStyle";
import MiniSearchNote from "../components/MiniSearchNote";
import FilterNotes from "../components/FilterNotes";
import { GroupByContainer } from "../elements/GroupByContainer";
import {
  faSortAlphaDown,
  faSortAlphaUp,
  faAngleRight,
  faAngleDown
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "../../node_modules/@fortawesome/react-fontawesome/index";
import { CreateFriendlyPreviewUrl } from "../utils/CreateFriendlyPreviewUrl";
import { CreateFriendlyDate } from "../utils/CreateFriendlyDate";

class SortNotes extends Component {
  constructor(props) {
    super(props);
    console.log(this.state)
    console.log(this.props)
    this.state = {
      groupBy: "url",
      expandTabs: [],
      sortType: "ascending",
    }
  }

  handleClick = (name) => {
    console.log("setting state");
    this.setState({
      groupBy: name
    })
  }

  handleTogglingNotes = (url) => {
    if (this.state.expandTabs.includes(url)) {
      this.setState({
        expandTabs: this.state.expandTabs.filter(tab => {
          console.log(tab + " : " + url + " = " + tab != url);
          return tab != url
        })
      })
    } else {
      this.setState({
        expandTabs: [...this.state.expandTabs, url]
      })
    }

  }

  handleToggleSortOrder = () => {
    if (this.state.sortType == 'ascending') {
      this.setState({
        sortType: "descending"
      })
    } else {
      this.setState({
        sortType: "ascending"
      })
    }
  }

  getSortingFunction = (sortType) => {
    switch (sortType) {
      case 'ascending':
        return this.ascendingSort;
      case 'descending':
        return this.descendingSort;
    }
  }

  getArraySortedWithDates = (state) => {
    console.log("getting new array")
    let newArray = {};

    Object.keys(state).map(key => {
      state[key].notes.map(note => {
        newArray[note.date_created] = { ...note, url: key };
      })
    })
    console.log("sorted array")
    console.log(Object.keys(newArray).sort(this.getSortingFunction(this.state.sortType)).map(key => newArray[key]));
    return Object.keys(newArray).sort(this.getSortingFunction(this.state.sortType)).map(key => newArray[key]);
  }

  ascendingSort = (a, b) => {
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
  }

  descendingSort = (a, b) => {
    if (a > b) { return -1; }
    if (a < b) { return 1; }
    return 0;
  }


  render() {
    console.log("render state")
    console.log(this.state)
    console.log(this.props.pages)
    return (
      <div style={{ padding: "10px" }}>
        <GroupByContainer>
          <p className="title">Sort By</p>
          <div className="button-container">
            <button onClick={() => this.handleClick('url')} className={this.state.groupBy == 'url' ? "selected" : ""}>Url</button>
            <button onClick={() => this.handleClick('date')} className={this.state.groupBy == 'date' ? "selected" : ""}>Date</button>
          </div>
          {this.state.sortType == 'ascending' && <FontAwesomeIcon icon={faSortAlphaDown} onClick={this.handleToggleSortOrder}></FontAwesomeIcon>}
          {this.state.sortType == 'descending' && <FontAwesomeIcon icon={faSortAlphaUp} onClick={this.handleToggleSortOrder}></FontAwesomeIcon>}
        </GroupByContainer>
        <Container>
          {(() => {
            switch (this.state.groupBy) {
              case 'url':
                return (
                  <div>
                    { Object.keys(this.props.pages)
                      .sort(this.getSortingFunction(this.state.sortType))
                      .map(key => {
                        console.log("mapping key")
                        console.log(key);
                        return (
                          <div>
                            <div className="url-selector" onClick={() => this.handleTogglingNotes(key)}>
                              {this.state.expandTabs.includes(key) ? <FontAwesomeIcon className="caret-icon" icon={faAngleDown}></FontAwesomeIcon>
                                : <FontAwesomeIcon className="caret-icon" icon={faAngleRight}></FontAwesomeIcon>}
                              <h3 style={{ display: "inline" }}>{CreateFriendlyPreviewUrl(key)}</h3>
                            </div>
                            { this.state.expandTabs.includes(key) && <div>
                              {
                                this.props.pages[key].notes.map(note => {
                                  return <MiniSearchNote {...note} website={key} previewText={CreateFriendlyPreviewUrl(key)}></MiniSearchNote>
                                })
                              }
                            </div>
                            }
                          </div>)
                      })}
                  </div>
                )
              case 'date':
                return (
                  <div>
                    { this.getArraySortedWithDates(this.props.pages).map(note => {
                      console.log("lol hello");
                      console.log(note);
                      return (
                        <div>
                          <div className="url-selector" onClick={() => this.handleTogglingNotes(note.id)}>
                            {this.state.expandTabs.includes(note.id) ? <FontAwesomeIcon className="caret-icon" icon={faAngleDown}></FontAwesomeIcon>
                              : <FontAwesomeIcon className="caret-icon" icon={faAngleRight}></FontAwesomeIcon>}
                            <h3 style={{ display: "inline" }}>{CreateFriendlyDate(note.date_created)}</h3>
                          </div>
                          {
                            this.state.expandTabs.includes(note.id) && <MiniSearchNote {...note} website={note.url}></MiniSearchNote>
                          }
                        </div>
                      )
                    })}
                  </div>
                )
              default:
                return (
                  <div>
                    <p>Error</p>
                  </div>
                )
            }
          })()}
        </Container >
      </div >
    );
  }
}

export default connect(
  state => {
    console.log("connect")
    console.log(state)
    return { pages: state };
  }, null
)(SortNotes);
