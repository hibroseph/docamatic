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

      console.log("note is being resized");

      return Object.assign({}, state, {
        [action.page]: {
          notes: state[action.page].notes.map(note => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                size: { width: action.x, height: action.y }
              });
            } else {
              return note;
            }
          })
        }
      });

    case 'CLICKED_NOTE':
        // console.log("You clicked a note");
        // console.log(state);

        // Loop through the state and find where the note is what you want to move

        // const note = state[action.page].notes.map(note => {
        //   if (note.id == action.id) {
        //     console.log("We found the note we are looking for");
        //     return note;
        //   } else {
        //     return null;
        //   }
        // })
        // console.log("page: " + action.page);
        // console.log("id: " + action.id);

        let note = state[action.page].notes.filter((note) => {
          console.log("running function on instance: ")
          console.log(note);
          if (note.id === action.id) {
            return note;
          }
        }).find(note => {
          return note.id === action.id
        })

        if (note === undefined) {
          return state;
        }
        
        const new_state = state[action.page].notes.filter(notes => {
          if (notes.id !== action.id) {
            return notes;
          }
        })

        new_state.push(note);

        return Object.assign({}, state, {
          [action.page]: {
            notes: new_state
          }
        })
        


    case "CHANGE_COLOR":
      // console.log("note is having its note color changed");

      return Object.assign({}, state, {
        [action._sender.url]: {
          notes: state[action._sender.url].notes.map(note => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                color: action.color,
                contrastColor: action.contrastColor
              });
            } else {
              return note;
            }
          })
        }
      });

    case "MOVE_NOTE":
      // console.log("MOVE_NOTE")
      // console.log("Changing position to: " + action.x + " ," + action.y)

      // return [   ...state.filter(note=>note.id !== action.id),
      //    state.find(note=>note.id === action.id) ]

      let stateNew = Object.assign({}, state, {
        // ...[action._sender.url],

        [action._sender.url]: {
          notes: state[action._sender.url].notes.map(note => {
            if (note.id === action.id) {
              // let's change the position
              return Object.assign({}, note, {
                position: { x: action.x, y: action.y }
              });
            } else {
              return note;
            }
          })
        }
      });
      // console.log("STATE IN REDUCER:");
      // console.log(stateNew);

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
      // console.log("Note is having it's title changed");

      return Object.assign({}, state, {
        [action._sender.url]: {
          notes: state[action._sender.url].notes.map(note => {
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
        }
      });

    case "ADD_TEXT":

      return Object.assign({}, state, {
        [action._sender.url]: {
          notes: state[action._sender.url].notes.map((note, id) => {
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
        }
      });

    case "REMOVE_NOTE":
      // console.log("Removing note with id: " + action.id);

      
      // Filter the id of the note that needs to be deleted out
      let notes = state[action._sender.url].notes.filter(note => {
        // console.log("note id: " + note.id)
        if (note.id != action.id) {
          // console.log("note id: " + note.id + " is not equal to action.id: " + action.id)
          return note;
        }
      });

      let newState = Object.assign({}, state, {
        [action._sender.url] : {
          notes
        }
      });

      // // Create the new state
      // let newState = Object.assign({}, state, {
      //   notes
      // });

      // Return that new state
      return newState;

    case "ADD_NOTE":

      // console.log("You are adding a note");

      // Generates a random position on the page
      const posx = Math.floor(Math.random() * (600 + 1));
      // const posy = Math.floor(Math.random() * (600 + 1));

      let page = action.page;
      // Generates a random int for a random color for the note
      let colorIndex = Math.floor(Math.random() * (7 + 1));

      // Generates a random int for random text
      const noteTextIndex = Math.floor(Math.random() * NoteMessages.length);

      // console.log("r: " + colorList[colorIndex].substr(1,2));
      // console.log("g: " + colorList[colorIndex].substr(3,2));
      // console.log("b: " + colorList[colorIndex].substr(5,2));

      // Calculating the color contrast when a note is created
      let r = parseInt(colorList[colorIndex].substr(1,2),16);
	    let g = parseInt(colorList[colorIndex].substr(3,2),16);
      let b = parseInt(colorList[colorIndex].substr(5,2),16);
      // console.log("r: " + r + " g: " + g + " b: " + b);
	    let yiq = ((r*299)+(g*587)+(b*114))/1000;
	    
      // console.log("Adding note: contrasting color: " + yiq);

      // If there are notes already on the page
      if (state[page] == null) {
        return Object.assign({}, state, {
          [action.page]: {
            notes: [
              {
                id: action.id,
                position: { x: posx, y: action.y_position },
                size: {
                  width: INITIAL_NOTE_WIDTH,
                  height: INITIAL_NOTE_HEIGHT
                },
                body: NoteMessages[noteTextIndex],
                title: action.title,
                color: colorList[colorIndex],
                contrastColor: (yiq >= 128) ? '#000' : '#fff'
              }
            ]
          }
        });
      } else {
        return Object.assign({}, state, {
          [action.page]: {
            notes: [
              ...state[action.page].notes,
              {
                id: action.id,
                position: { x: posx, y: action.y_position },
                size: {
                  width: INITIAL_NOTE_WIDTH,
                  height: INITIAL_NOTE_HEIGHT
                },
                body: NoteMessages[noteTextIndex],
                title: action.title,
                color: colorList[colorIndex],
                contrastColor: (yiq >= 128) ? '#000' : '#fff'
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
