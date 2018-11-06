const colorList = ["#0082C8", "#FFD03E", "#b3fedf", "#5a3791", "#2daa4b",
    "#0082c8", "#eac0c8", "#b9893c", "#ff3561", "#008080"]

const notesApp = (state = [], action) => {
    switch (action.type) {

        case 'REMOVE_NOTE':
            console.log("Removing note with id: " + action.id)

            let notes = state.notes.slice(0, action.id)
                .concat(state.notes.slice(action.id + 1));

            let newState = Object.assign({}, state, {
                notes
            });

            console.log("newState")
            console.log(newState)
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
                        color: colorList[colorIndex]
                    }
                ]
            })

        default:
            return state;
    }
}

export default notesApp
