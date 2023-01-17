import { COLORS as colorList, INITIAL_NOTE_WIDTH } from "../utils/constants";
import { getContrastingColor } from "../utils/ContrastingColor";
import { ADD_TAG, REMOVE_TAG, NUKE_NOTES } from "./actions";
//import * as Sentry from "@sentry/react";
import { generateUUID } from "../utils/GenerateUUID";
import { getRandomTagColor} from "../utils/RandomTagColor";
/*
import config from

Sentry.init({
  dsn: "https://56a60e709a48484db373a4ca2f4cf026@sentry.io/1368219",
  environment: ENVIRONMENT,
  release: RELEASE + VERSION,
});*/

// Messages to appear when a note is created
const NoteMessages = [
  "Wanna Remember Something? Put it here!",
  "Here is your new note! Enter text here",
  "You should probably put something more useful than this message",
  "CONGRATS! You made a note!",
  "What do you want to remember today?",
  "Ooo what a nice color",
  "Wanna change the color? Press the color button",
];


const REDUCER_ERROR_TITLE = "Reducer";

const notesApp = (state = [], action) => {
  switch (action.type) {
    case ADD_TAG:
      // 3 cases, 
      //1. tag exists but doesn't exist on the note
      //2. tag doesn't exist
      //3. tag exists and exists on the note
      var tagExists = state?.tags?.find(tag => tag.text == action.text);
      var noteHasTag = tagExists?.notes?.find(id => id == action.noteId);

      if (tagExists && noteHasTag == undefined) {
        newState = Object.assign({},
          state,
          {
          pages: {
            ...state.pages,
            [action.url]: Object.assign({}, {
            notes: Object.assign([], 
              state.pages[action.url].notes.map(note => {
                if (note.id != action.noteId)
                  return note;
                else 
                  return { 
                    ...note, 
                    tags: [
                      ...note?.tags?.filter(tag => tag.id != tagExists.id) || {},
                    {
                      id: tagExists.id
                    }] 
                }
              })
            )
          })}},
          {
            tags: [
              ...state.tags.map(tag => {
              if (tag.id != tagExists.id) {
                return tag;
              } else {
                // we found the tag we need to add the note to
                const {notes, ...strippedTag} = tag;
                return {
                  ...strippedTag,
                  notes: [
                    ...notes, 
                    action.noteId]
                }
              }
            })]
          })
      } else if (tagExists && noteHasTag) {
        newState = state;
      } else if (tagExists == undefined) {
        var tagId = generateUUID();
        newState = Object.assign({}, 
          state, 
          {
            pages: {
              ...state.pages,
              [action.url]: Object.assign({}, {
              notes: Object.assign([], 
                state.pages[action.url].notes.map(note => {
                  if (note.id != action.noteId)
                    return note;
                  else 
                    return { 
                      ...note, 
                      tags: [
                        ...note?.tags || {},
                        {
                          id: tagId
                        }
                      ] 
                    }
                })
              )
          })}
        },
        { 
          tags: 
            [...state?.tags || {}, 
              { 
              id: tagId, 
              color: getRandomTagColor(), 
              text: action.text,
              notes:[ action.noteId]
              }
            ]
        })
      };
      return newState;

    case REMOVE_TAG:

      // We need to do 2 things
      // 1. Removing the referenced tag from the notes node
      // 2. Remove the referenced note from the tags node

      let newTagState = Object.assign({}, 
        state,
        {
          pages: {
            ...state.pages,
            [action.url]: Object.assign({}, {
            notes: Object.assign([],
              state.pages[action.url].notes.map(note => {
                if (note.id != action.noteId)
                  return note;
                else
                  return {
                    ...note,
                    tags: note.tags.filter(p => p.id != action.tagId)
                  };
                }
              )
            )
          })
        }
        },
        {
          tags: state.tags.map(tag => {
            if (tag.id != action.tagId) 
              return tag;
            else
              return {
                ...tag,
                notes: tag.notes.filter(p => p != action.noteId)
              }
          })
          .filter(tag => tag.notes.length > 0)
        }
      )

      return newTagState;

    case NUKE_NOTES:
      return {};

    case "IMPORT_NOTES":
      // The following logic loops over the notes being imported and only adds ones that don't exist in the current state.
      let finalState = Object.keys(action.notes).reduce((finalReducedState, key) => {
        if (state.pages[key] != null) {
          let noteIds = state[key].notes.reduce((map, obj) => {
            map[obj.id] = obj;
            return map;
          }, {});

          let newStateCombinedWithNewNotes = action.notes[key].notes.reduce((reducedState, note) => {
            if (noteIds[note.id] == null) {
              return Object.assign({}, reducedState, {
                [key]: {
                  notes: [...reducedState[key].notes, note],
                },
              });
            } else {
              return newState;
            }
          }, finalReducedState);

          finalReducedState = Object.assign({}, finalReducedState, newStateCombinedWithNewNotes);

          return finalReducedState;
        } else {
          // add notes to state since the key doesn't exist
          return Object.assign({}, finalReducedState, {
            [key]: {
              notes: action.notes[key].notes,
            },
          });
        }
      }, state);

      return finalState;

    case "HEARTIFY":
      return Object.assign({}, state, {
        pages: {
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                heart: !note.heart,
              });
            } else {
              return note;
            }
          }),
        }},
      });

    case "STICKIFY":
      return Object.assign({}, state, {
        pages: {
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                stickify: !note.stickify,
              });
            } else {
              return note;
            }
          }),
        }},
      });

    case "RESIZE_NOTE":
      return Object.assign({}, state, {
        pages: {
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                size: { width: action.x },
              });
            } else {
              return note;
            }
          }),
        }},
      });

    case "CLICKED_NOTE":
      let note = state.pages[action.url].notes
        .filter((note) => {
          if (note.id === action.id) {
            return note;
          }
        })
        .find((note) => {
          return note.id === action.id;
        });

      if (note === undefined) {
        return state;
      }

      const new_state = state.pages[action.url].notes.filter((notes) => {
        if (notes.id !== action.id) {
          return notes;
        }
      });

      new_state.push(note);

      return Object.assign({}, state, {
        pages: {
          ...state.pages,
          [action.url]: {
          notes: new_state,
        }},
      });

    case "CHANGE_COLOR":
      let newState = Object.assign({}, state, {
        pages:{
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                color: {
                  title: action.color,
                  text: getContrastingColor(action.color),
                },
              });
            } else {
              return note;
            }
          }),
        }},
      });
      return newState;

    case "MOVE_NOTE":
      let stateNew = Object.assign({}, state, {
        pages:{
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note) => {
            if (note.id === action.id) {
              // let's change the position
              return Object.assign({}, note, {
                position: { x: action.x, y: action.y },
              });
            } else {
              return note;
            }
          }),
        }},
      });

      return stateNew;

    case "TOGGLE_VISIBILITY":
      return Object.assign({}, state, {
        pages:{
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                visible: action.visible,
              });
            } else {
              return note;
            }
          }),
        }},
      });

    case "ADD_TITLE":
      return Object.assign({}, state, {
        pages:{
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                title: action.title,
              });
            } else {
              return note;
            }
          }),
        }},
      });

    case "ADD_TEXT":
      return Object.assign({}, state, {
        pages:{
          ...state.pages,
          [action.url]: {
          notes: state.pages[action.url].notes.map((note, id) => {
            if (note.id === action.id) {
              return Object.assign({}, note, {
                body: action.body,
              });
            } else {
              return note;
            }
          }),
        }},
      });

    case "REMOVE_NOTE":
      try {
        // Filter the id of the note that needs to be deleted out
        let notes = state.pages[action.url].notes.filter((note) => {
          if (note.id != action.id) {
            return note;
          }
        });

        return Object.assign({}, state, {
          pages:{
            ...state.pages,
            [action.url]: {
            notes,
          }},
        },
        {
          tags: state.tags?.map(tag => { 
            return {
              ...tag,
              notes: tag.notes.filter(p => p != action.id)
              }
          }).filter(tag => tag.notes.length > 0)
        });
      } catch (error) {
        Sentry.captureException(error);
        return state;
      }

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
      if (state.pages[action.url] == null) {
        return Object.assign({}, state, {
          pages: {
            ...state.pages,
            [action.url]: {
            notes: [
              {
                id: action.id,
                position: { x: posx, y: action.y_position },
                size: {
                  width: INITIAL_NOTE_WIDTH,
                },
                body: action.highlightedText || null,
                title: null,
                // color: colorList[colorIndex],
                // contrastColor: yiq >= 128 ? "#000" : "#fff",
                date_created: action.date_created,
                color: {
                  title: colorList[colorIndex],
                  text: yiq >= 128 ? "#000" : "#fff",
                },
                stickify: false,
                heart: false,
                visible: true
              },
            ],
          }}
        
});
      } else {
        return Object.assign({}, state, {
          pages: {
            ...state.pages,
            [action.url]: {
              notes: [
                ...state.pages[action.url].notes,
                {
                  id: action.id,
                  position: { x: posx, y: action.y_position },
                  size: {
                    width: INITIAL_NOTE_WIDTH,
                  },
                  body: action.highlightedText || null, 
                  title: null,
                  // color: colorList[colorIndex],
                  // contrastColor: yiq >= 128 ? "#000" : "#fff",
                  date_created: action.date_created,
                  color: {
                    title: colorList[colorIndex],
                    text: yiq >= 128 ? "#000" : "#fff",
                  },
                  visible: true,
                },
              ],
            }},
          });
      }

    default:
      return state;
  }
};

export default notesApp;
