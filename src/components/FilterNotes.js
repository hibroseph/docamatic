import React, { Component } from "react";
// import { SearchNotes as Container } from "../styles/SearchNotesStyle";
import { FilterNotes as Container } from "../styles/FilterNotesStyle";
import MiniSearchNote from "../components/MiniSearchNote";
import { connect } from "react-redux";
/* This component will take in some sort of parameter that will

detail to it on how to sort all the notes.
Possible parameter ideas
- date
- page
- alphabetical (title)
- color of note 
parameter prop 
SortBy : string
OrderBy : string
<FilterNotes SortBy={"Date"} OrderBy={"Assending"}
maybe pass a function to compare?  
*/
class FilterNotes extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let foundItem = false;

    const element = Object.keys(this.props.state).map(key => {
      return (
        <div key={key}>
          {this.props.labels && <div className="label">{key} </div>}
          {this.props.state[key].notes.map(note => {
            // Comparing happens right here
            if (this.props.filter(note)) {
              foundItem = true;
              return <MiniSearchNote key={note.id} {...note} website={key} />;
            }
          })}
        </div>
      );
    });

    if (foundItem) {
      return (
        <Container>
          <div
            className={this.props.style ? this.props.style : "filter-results"}
          >
            {element}
          </div>
        </Container>
      );
    } else {
      return <img style={{ marginTop: 100, marginLeft: 10 }} src={this.props.noResultsImg}></img>
    }
  }
}

export default connect(
  state => {
    return { state: state };
  },
  null
)(FilterNotes);
