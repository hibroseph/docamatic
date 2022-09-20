import * as React from "react";
import { DraggableNote } from "./Note/DraggableNote";
import { connect } from "react-redux";
import * as Types from "../types";
import {
  updateNotePosition,
  updateNoteSize
} from "../redux/actions";
import { GetSafeNoteUrl} from "../utils/GetSafeNoteUrl"


class NoteList extends React.Component<Types.NoteListProps, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    console.log("inside of note list rendering")

    
    return (
      <div>
        {this.props.url && this.props.notes.map(note => {
          if (note.visible || note.visible == undefined) {
            console.log("rendering");
            console.log(note);
            return (
              <DraggableNote
                onPositionChange={(id, x, y) =>
                  this.props.onPositionChange(id, x, y, this.props.url)
                }
                onSizeChange={(width, height) =>
                  this.props.onSizeChange(note.id, width, height, this.props.url)
                }
                key={note.id}
                {...note}
                scrollYOffset={this.props.scrollYOffset}
                url={this.props.url}
              />
            )
          }
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {

  let safeUrl:string = GetSafeNoteUrl(window.location.href);

  if (state[safeUrl] == null) {
    return {
      notes: []
    };
  } else {
    return {
      notes: state[safeUrl].notes,
      scrollYOffset: props.scrollYOffset
    };
  }
};

const mapDispatchToProps = dispatch => ({
  onSizeChange: (id, x, y, url) => dispatch(updateNoteSize(id, x, y, url)),
  onPositionChange: (id, x, y, url) => dispatch(updateNotePosition(id, x, y, url)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NoteList);
