// const INITIAL_NOTE_WIDTH = 250;
// const INITIAL_NOTE_HEIGHT = 400;

import {
  COLORS as colorList,
  INITIAL_NOTE_HEIGHT,
  INITIAL_NOTE_WIDTH
} from "../utils/constants";
import { getContrastingColor } from "../utils/ContrastingColor";

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
    case "HEARTIFY":
      return Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map(note => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                heart: !note.heart
              });
            } else {
              return note;
            }
          })
        }
      });

    case "STICKIFY":
      return Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map(note => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                stickify: !note.stickify
              });
            } else {
              return note;
            }
          })
        }
      });

    case "RESIZE_NOTE":
      return Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map(note => {
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

    case "CLICKED_NOTE":
      let note = state[action.url].notes
        .filter(note => {
          if (note.id === action.id) {
            return note;
          }
        })
        .find(note => {
          return note.id === action.id;
        });

      if (note === undefined) {
        return state;
      }

      const new_state = state[action.url].notes.filter(notes => {
        if (notes.id !== action.id) {
          return notes;
        }
      });

      new_state.push(note);

      return Object.assign({}, state, {
        [action.url]: {
          notes: new_state
        }
      });

    case "CHANGE_COLOR":
      let newState = Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map(note => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                color: {
                  title: action.color,
                  text: getContrastingColor(action.color)
                }
              });
            } else {
              return note;
            }
          })
        }
      });
      return newState;

    case "MOVE_NOTE":
      let stateNew = Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map(note => {
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

      return stateNew;

    case "TOGGLE_VISIBILITY":
      return Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map(note => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                visible: action.visible
              });
            } else {
              return note;
            }
          })
        }
      });

    case "ADD_TITLE":
      return Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map(note => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                title: action.title
              });
            } else {
              return note;
            }
          })
        }
      });

    case "ADD_TEXT":
      return Object.assign({}, state, {
        [action.url]: {
          notes: state[action.url].notes.map((note, id) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                body: action.body
              });
            } else {
              return note;
            }
          })
        }
      });

    case "REMOVE_NOTE":
      // Filter the id of the note that needs to be deleted out
      let notes = state[action.url].notes.filter(note => {
        if (note.id != action.id) {
          return note;
        }
      });

      let newState = Object.assign({}, state, {
        [action.url]: {
          notes
        }
      });

      return newState;

    case "ADD_NOTE":
      // Generates a random position on the page
      const posx = Math.floor(Math.random() * (600 + 1));

      // Generates a random int for a random color for the note
      let colorIndex = Math.floor(Math.random() * colorList.length);

      // Generates a random int for random text
      const noteTextIndex = Math.floor(Math.random() * NoteMessages.length);

      // Calculating the color contrast when a note is created
      let r = parseInt(colorList[colorIndex].substr(1, 2), 16);
      let g = parseInt(colorList[colorIndex].substr(3, 2), 16);
      let b = parseInt(colorList[colorIndex].substr(5, 2), 16);
      let yiq = (r * 299 + g * 587 + b * 114) / 1000;

      // If there are notes already on the page
      if (state[action.url] == null) {
        return Object.assign({}, state, {
          [action.url]: {
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
                // color: colorList[colorIndex],
                // contrastColor: yiq >= 128 ? "#000" : "#fff",
                date_created: action.date_created,
                color: {
                  title: colorList[colorIndex],
                  text: yiq >= 128 ? "#000" : "#fff"
                },
                stickify: false,
                heart: false,
                visible: false
              }
            ]
          }
        });
      } else {
        return Object.assign({}, state, {
          [action.url]: {
            notes: [
              ...state[action.url].notes,
              {
                id: action.id,
                position: { x: posx, y: action.y_position },
                size: {
                  width: INITIAL_NOTE_WIDTH,
                  height: INITIAL_NOTE_HEIGHT
                },
                body: NoteMessages[noteTextIndex],
                title: action.title,
                // color: colorList[colorIndex],
                // contrastColor: yiq >= 128 ? "#000" : "#fff",
                date_created: action.date_created,
                color: {
                  title: colorList[colorIndex],
                  text: yiq >= 128 ? "#000" : "#fff"
                },
                visible: false
              }
            ]
          }
        });
      }

    default:
      return state;
  }
};

export default notesApp;
