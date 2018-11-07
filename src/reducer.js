const colorList = ["#0082C8", "#FFD03E", "#b3fedf", "#5a3791", "#2daa4b",
    "#5bc0de", "#eac0c8", "#ff3561", "#ff3561", "#008080"]



const notesApp = (state = [], action) => {
    switch (action.type) {
       
        case 'ADD_TITLE':
            console.log("We are adding text to the title with id: " + action.id);
            console.log("with the current title: " + action.title)

            return Object.assign({}, state, {
                notes: state.notes.map((note, index) => {
                    if (index === action.id) {
                        return Object.assign({}, note, {
                            title: action.title
                        })
                    }
                })
            })

            // Logic to add a title
            // return state;

        case 'ADD_TEXT':
            console.log("We are adding text to note with id: " + action.id);
            console.log("and the text: " + action.body)

            // let note = state.notes[action.id]
        

            // let newNote = note
            // newNote.body = action.body

            // // add the new note to the new state
            // let newerState = Object.assign({}, state, {
            //     notes: [
            //         ...state.notes
            //     ]
            // })

            // newerState.notes[action.id] = newNote

            // console.log(newerState)

            return Object.assign({}, state, {
                notes: state.notes.map((note, index) => {
                    if (index === action.id) {
                        return Object.assign({}, note, {
                            body: action.body
                        })
                    }
                })
            });

        case 'REMOVE_NOTE':
            console.log("Removing note with id: " + action.id);

            // Filter the id of the note that needs to be deleted out
            let notes = state.notes.filter((note) => {
                console.log("note id: " + note.id)
                if (note.id != action.id) {
                    console.log("note id: " + note.id + " is not equal to action.id: " + action.id)
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

            console.log("Adding note with id: " + action.id)

            // Generates a random position on the page
            const posx = Math.floor(Math.random() * (600 + 1));
            const posy = Math.floor(Math.random() * (600 + 1));

            // Generates a random int for a random color for the note
            const colorIndex = Math.floor(Math.random() * (9 + 1))

            console.log("The color: " + colorList[colorIndex] + " was choosen")
            return Object.assign({}, state, {
                notes: [
                    ...state.notes,
                    {
                        id: action.id,
                        position: { x: posx, y: posy },
                        body: action.text,
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
