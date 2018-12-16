import React, { Component } from "react";
import NewNote from "../components/NewNote";
import Search from "../components/Search";
import { connect } from "react-redux";
import MiniSearchNote from "../components/MiniSearchNote";

class Popup extends Component {
  constructor(props) {
    super(props);

    this.state = { search_query: null };
  }

  render() {
    console.log("popup.js state:");
    console.log(this.props.state);

    // What are the keys?
    console.log("The keys of the state:");
    console.log(Object.keys(this.props.state));

    return (
      <div style={{ width: 200, height: 200 }}>
        <NewNote />

        <Search
          onSearch={value => {
            // Update the component state of the search query
            if (value != "") {
              this.setState({
                search_query: value
              });
            } else {
              this.setState({
                search_query: null
              });
            }
          }}
        />

        <div
          className="note_scroll_list"
          style={{ overflow: "auto", height: "inherit", display: "block" }}
        >
          {Object.keys(this.props.state).map(key => {
            return this.props.state[key].notes.map(note => {
              if (this.state.search_query != null) {
                if (
                  note.body.includes(this.state.search_query) ||
                  note.title.includes(this.state.search_query)
                ) {
                  console.log("We found a note that matches your search query");
                  // Split the text to bold the part that is the search query
                  let text = note.body.split(this.state.search_query);

                  return (
                    // <div style={{ padding: 5 }}>
                    //   <div> Note ID: {note.id} </div>
                    //   <div> Note Title: {note.title} </div>
                    //   <div>
                    //     Note Text:
                    //     <div>
                    //       {text[0]}
                    //       <span style={{ fontWeight: "bold" }}>
                    //         {this.state.search_query}
                    //       </span>
                    //       {text[1]}
                    //     </div>
                    //   </div>
                    // </div>

                    <MiniSearchNote
                      {...note}
                      text={text}
                      searchQuery={this.state.search_query}
                    />
                  );
                }
              } else {
                return <div> </div>;
              }
            });
          })}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state
  };
};

export default connect(mapStateToProps)(Popup);
