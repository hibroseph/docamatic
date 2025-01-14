import React, { Component } from "react";
import { SortNotesByDate } from './SortNotesByDate';
import { SortNotesByUrl } from "./SortNotesByUrl";
import { SortingHeader } from "../SortingHeader";
import { connect } from "react-redux";
import { FilterNotes as Container } from "../FilterNotesStyle";
import { NoRenderErrorBoundary } from "../../NoRenderErrorBoundary";


class SortNotes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groupBy: "url",
      expandTabs: [],
      sortType: "ascending",
      dateGroupingKey: "minute"
    }
  }

  handleClick = (name) => {
    this.setState({
      groupBy: name
    })
  }

  handleTogglingNotes = (url) => {
    if (this.state.expandTabs.includes(url)) {
      this.setState({
        expandTabs: this.state.expandTabs.filter(tab => {
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

  getSortingFunction = () => {
    switch (this.state.sortType) {
      case 'ascending':
        return this.ascendingSort;
      case 'descending':
        return this.descendingSort;
    }
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

  handleDateGroupingKey = (key) => {
    this.setState({ dateGroupingKey: key })
  }

  render() {
    return (
      <div>
        <SortingHeader
          handleClick={selectedItem => this.handleClick(selectedItem)}
          groupBy={this.state.groupBy}
          sortType={this.state.sortType}
          handleToggleSortOrder={() => this.handleToggleSortOrder()}
          handleDateGroupingKey={(key) => this.handleDateGroupingKey(key)}
          dateGroupingKey={this.state.dateGroupingKey}>
        </SortingHeader>
        <Container>
          {(() => {
            switch (this.state.groupBy) {
              case 'url':
                return (
                  <NoRenderErrorBoundary>
                  <SortNotesByUrl
                    pages={this.props.notes}
                    tags={this.props.tags}
                    getSortedArrayWithUrl={() => this.getSortedArrayWithUrl()}
                    handleTogglingNotes={key => this.handleTogglingNotes(key)}
                    expandTabs={this.state.expandTabs}
                    getSortingFunction={() => this.getSortingFunction()}
                  ></SortNotesByUrl>
                  </NoRenderErrorBoundary>
                )
              case 'date':
                return (
                  <NoRenderErrorBoundary>
                  <SortNotesByDate
                    pages={this.props.notes}
                    tags={this.props.tags}
                    getSortingFunction={() => this.getSortingFunction()}
                    handleTogglingNotes={(key) => this.handleTogglingNotes(key)}
                    expandTabs={this.state.expandTabs}
                    groupingKey={this.state.dateGroupingKey}
                  ></SortNotesByDate>
                  </NoRenderErrorBoundary>
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
    return {
      notes: state.pages,
      tags: state.tags
    }
  }
  , null
)(SortNotes);
