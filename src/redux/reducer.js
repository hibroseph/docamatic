const INITIAL_NOTE_WIDTH = 250;
const INITIAL_NOTE_HEIGHT = 400;

// Messages to appear when a note is created
const colorList = [
  "#0082C8",
  "#FFD03E",
  "#b3fedf",
  "#5a3791",
  "#2daa4b",
  "#5bc0de",
  "#eac0c8",
  "#008080"
];

// Messages to appear when a note is created
const NoteMessages = [
  "Wanna Remember Something? Put it here!",
  "Here is your new note! Enter text here",
  "You should probably put something more useful than this message",
  "CONGRATS! You made a note!",
  "What do you want to remember today?",
  "Ooo what a nice color",
  "Wanna change the color? Press the color button"
];

const notesApp = (state = [], action) => {
  switch (action.type) {
    case "RESIZE_NOTE":
      // console.log("New size: " + action.id + " " + action.x + " ," + action.y);

      return Object.assign({}, state, {
        notes: state.notes.map(note => {
          if (note.id === action.id) {
            return Object.assign({}, note, {
              size: { width: action.x, height: action.y }
            });
          } else {
            return note;
          }
        })
      });

    // case 'CLICKED_NOTE':
    //     console.log("YOU CLICKED NOTE: " + action.id + "!!!!")
    //     return state;

    case "CHANGE_COLOR":
      // console.log("You want to change the color of note: " + action.id);

      // Generates a random int for a random color for the note
      let colorIndex = Math.floor(Math.random() * (6 + 1));

      return Object.assign({}, state, {
        notes: state.notes.map(note => {
          if (note.id === action.id) {
            return Object.assign({}, note, {
              color: colorList[colorIndex]
            });
          } else {
            return note;
          }
        })
      });

    case "MOVE_NOTE":
      // console.log("MOVE_NOTE")
      // console.log("Changing position to: " + action.x + " ," + action.y)

      // return [   ...state.filter(note=>note.id !== action.id),
      //    state.find(note=>note.id === action.id) ]

      let stateNew = Object.assign({}, state, {
        notes: state.notes.map(note => {
          if (note.id === action.id) {
            // let's change the position
            return Object.assign({}, note, {
              position: { x: action.x, y: action.y }
            });
          } else {
            return note;
          }
        })
      });

      return stateNew;
    // return Object.assign({}, state, {
    //     notes: state.notes.map((note) => {
    //         if (note.id === action.id) {
    //             // let's change the position
    //             return Object.assign({}, note, {
    //                 position: { x: action.x, y: action.y }
    //             })
    //         } else {
    //             return note;
    //         }
    //     })
    // })

    case "ADD_TITLE":
      // console.log("We are adding text to the title with id: " + action.id);
      // console.log("with the current title: " + action.title)

      return Object.assign({}, state, {
        notes: state.notes.map(note => {
          if (note.id === action.id) {
            // console.log("The note.id: " + note.id + " is equal to action.id: " + action.id)
            return Object.assign({}, note, {
              title: action.title
            });
          } else {
            // console.log("The note.id: " + note.id + " is NOT equal to the action id: " + action.id)
            return note;
          }
        })
      });

    case "ADD_TEXT":
      // console.log("We are adding text to note with id: " + action.id);
      // console.log("and the text: " + action.body)

      return Object.assign({}, state, {
        notes: state.notes.map((note, id) => {
          if (note.id === action.id) {
            // console.log("index: " + note.id + " is equal to the action id: " + action.id)
            return Object.assign({}, note, {
              body: action.body
            });
          } else {
            // console.log("index: " + note.id + " is NOT equal to the action id: " + action.id)
            return note;
          }
        })
      });

    case "REMOVE_NOTE":
      // console.log("Removing note with id: " + action.id);

      // Filter the id of the note that needs to be deleted out
      let notes = state.notes.filter(note => {
        // console.log("note id: " + note.id)
        if (note.id != action.id) {
          // console.log("note id: " + note.id + " is not equal to action.id: " + action.id)
          return note;
        }
      });

      // Create the new state
      let newState = Object.assign({}, state, {
        notes
      });

      // Return that new state
      return newState;

    case "ADD_NOTE":
      // console.log("Adding note with id: " + action.id)

      console.log("Adding note @ page: " + action.page);
      // Generates a random position on the page
      const posx = Math.floor(Math.random() * (600 + 1));
      // const posy = Math.floor(Math.random() * (600 + 1));

      let page = action.page;
      // Generates a random int for a random color for the note
      colorIndex = Math.floor(Math.random() * (7 + 1));

      // Generates a random int for random text
      const noteTextIndex = Math.floor(Math.random() * NoteMessages.length);

      // return {
      //   ...state,
      //   [page]: [
      //     ...state.page.notes,
      //     {
      //       id: action.id,
      //       position: { x: posx, y: action.y_position },
      //       size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
      //       body: NoteMessages[noteTextIndex],
      //       title: action.title,
      //       color: colorList[colorIndex]
      //     }
      //   ]
      // };

      console.log("is state[page] equal to null?");
      console.log(state[page] == null);
    
      // If there are notes already on the page 
      if(state[page] == null) {
        return Object.assign({}, state, {
          [page]: {
            notes: [
              {
                id: action.id,
                position: { x: posx, y: action.y_position },
                size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
                body: NoteMessages[noteTextIndex],
                title: action.title,
                color: colorList[colorIndex]
              }  
            ]
          }
        })
      } else {
        return Object.assign({}, state, {
          [page]: {
            notes: [
              ...state[page].notes,
              {
                id: action.id,
                position: { x: posx, y: action.y_position },
                size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
                body: NoteMessages[noteTextIndex],
                title: action.title,
                color: colorList[colorIndex]
              }
            ]
          }
        });  
      }

      // console.log("length of noteMessages" + NoteMessages.length)
      

    default:
      return state;
  }
};

export default notesApp;
