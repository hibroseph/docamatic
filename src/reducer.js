const colorList = [
    "#0082C8",
    "#FFD03E",
    "#b3fedf",
    "#5a3791",
    "#2daa4b",
    "#5bc0de",
    "#eac0c8",
    "#ff3561",
    "#ff3561",
    "#008080"]


const NoteMessages = [
    "Wanna Remember Something? Put it here!",
    "Here is your new note! Enter text here",
    "You should probably put something more useful than this message",
    "CONGRATS! You made a note!",
    "What do you want to remember today?",
    "Ooo what a nice color",
    "Wanna change the color? Press the color button"]

const notesApp = (state = [], action) => {
    switch (action.type) {

        case 'CHANGE_COLOR':
            console.log("You want to change the color of note: " + action.id);

            // Generates a random int for a random color for the note
            let colorIndex = Math.floor(Math.random() * (9 + 1))

            return Object.assign({}, state, {
                notes: state.notes.map((note) => {
                    if (note.id === action.id) {
                        return Object.assign({}, note, {
                            color: colorList[colorIndex]
                        })
                    } else {
                        return note;
                    }
                })
            })

        case 'MOVE_NOTE':
            // console.log("MOVE_NOTE")
            // console.log("Changing position to: " + action.x + " ," + action.y)

            return Object.assign({}, state, {
                notes: state.notes.map((note) => {
                    if (note.id === action.id) {
                        // let's change the position
                        return Object.assign({}, note, {
                            position: { x: action.x, y: action.y }
                        })
                    } else {
                        return note;
                    }
                })
            })

        case 'ADD_TITLE':
            // console.log("We are adding text to the title with id: " + action.id);
            // console.log("with the current title: " + action.title)

            return Object.assign({}, state, {
                notes: state.notes.map((note) => {
                    if (note.id === action.id) {
                        // console.log("The note.id: " + note.id + " is equal to action.id: " + action.id)
                        return Object.assign({}, note, {
                            title: action.title
                        })
                    } else {
                        // console.log("The note.id: " + note.id + " is NOT equal to the action id: " + action.id)
                        return note;
                    }
                })
            })

        case 'ADD_TEXT':
            // console.log("We are adding text to note with id: " + action.id);
            // console.log("and the text: " + action.body)

            return Object.assign({}, state, {
                notes: state.notes.map((note, id) => {
                    if (note.id === action.id) {
                        // console.log("index: " + note.id + " is equal to the action id: " + action.id)
                        return Object.assign({}, note, {
                            body: action.body
                        })
                    } else {
                        // console.log("index: " + note.id + " is NOT equal to the action id: " + action.id)
                        return note;
                    }
                })
            });

        case 'REMOVE_NOTE':
            // console.log("Removing note with id: " + action.id);

            // Filter the id of the note that needs to be deleted out
            let notes = state.notes.filter((note) => {
                // console.log("note id: " + note.id)
                if (note.id != action.id) {
                    // console.log("note id: " + note.id + " is not equal to action.id: " + action.id)
                    return note;
                }
            })

            // Create the new state
            let newState = Object.assign({}, state, {
                notes
            })

            // Return that new state
            return newState;


        case 'ADD_NOTE':

            // console.log("Adding note with id: " + action.id)

            // Generates a random position on the page
            const posx = Math.floor(Math.random() * (600 + 1));
            const posy = Math.floor(Math.random() * (600 + 1));

            // Generates a random int for a random color for the note
            colorIndex = Math.floor(Math.random() * (9 + 1))

            // Generates a random int for random text
            const noteTextIndex = Math.floor(Math.random() * (5 + 1))

            // console.log("The color: " + colorList[colorIndex] + " was choosen")

            return Object.assign({}, state, {
                notes: [
                    ...state.notes,
                    {
                        id: action.id,
                        position: { x: posx, y: posy },
                        body: NoteMessages[noteTextIndex],
                        title: action.title,
                        color: colorList[colorIndex]
                    }
                ]
            })

        default:
            return state;
    }
}

export default notesApp