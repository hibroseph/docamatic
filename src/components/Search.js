import React, { Component } from "react";
import { connect } from "react-redux";

class Search extends Component {
  render(notes) {
    console.log("render in Search")

    console.log(notes);

    return (
      <div>
        <form>
          <input type="text" />
        </form>
        <button>Search</button>
 
         {/* if(notes)
         {
           <p>
             {notes.map(note => {
               return <p>{note.title}</p>;
             })}
           </p>
         } */}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    notes: state.notes
  };
}
export default connect(mapStateToProps)(Search);
