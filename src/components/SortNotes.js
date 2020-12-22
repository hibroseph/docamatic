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
  faCaretDown,
  faAngleRight,
  faAngleDown
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "../../node_modules/@fortawesome/react-fontawesome/index";
import { CreateFriendlyPreviewUrl } from "../utils/CreateFriendlyPreviewUrl";

class SortNotes extends Component {
  constructor(props) {
    super(props);
    console.log(this.state)
    console.log(this.props)
    this.state = {
      groupBy: "url",
      expandTabs: []
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

  render() {
    console.log("render state")
    console.log(this.state)
    return (
      <div style={{ padding: "10px" }}>
        <GroupByContainer>
          <h2>Sort By</h2>
          <div className="button-container">
            <button onClick={() => this.handleClick('url')} className="selected">Url</button>
            <button onClick={() => this.handleClick('date')}>Date</button>
          </div>
        </GroupByContainer>
        <Container>
          {(() => {
            switch (this.state.groupBy) {
              case 'url':
                return (
                  <div>
                    <h2>Sorting by URL</h2>
                    { Object.keys(this.props.pages).map(key => {
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
                                return <MiniSearchNote {...note} website={key}></MiniSearchNote>
                              })
                            }
                          </div>
                          }
                        </div>)
                    })}
                  </div>
                )
              case 'date':
                return <h2>Sorting by Date</h2>
              default:
                return <p>ERRROR</p>
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
