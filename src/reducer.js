// function notes(state, action) {
//     // See if the state of the application is undefined
//     if (typeof state === 'undefined') {
//         // Probably need to change this
//         return 0;
//     }

//     if (action.type === 'DELETE_NOTE') {
//         // Get the index from the action
//         const index = action.index;

//         // return a new state with the alerted correction
//         return state
//     } else if (action.type === 'ADD_NOTE') {
//         const index = action.index;

//         // return a new state with the alerted correction
//         return state
//     } else {
//         // If we don't understand the action, return the current state
//         return state
//     }
// }

// THESE TWO ARE THE SAME

const notesApp = (state = [], action) => {
    switch (action.type) {

        case 'REMOVE_NOTE':
            console.log("We gonna remove " + action.id + " note");

            // newObj = { notes: state.notes.filter()}
            let notes = state.notes.slice(0, action.id)
                .concat(state.notes.slice(action.id + 1));

            let newState = Object.assign({}, state, {
                notes
            });

            console.log("newState")
            console.log(newState)
            return newState;

        case 'ADD_NOTE':

            console.log("ADD_NOTE was called in reducer");

            return Object.assign({}, state, {
                notes: [
                    ...state.notes,
                    {
                        id: action.id,
                        position: { x: 100, y: 100 },
                        body: action.text,
                        color: "#7fffd4"
                    }
                ]
            })

        default:
            return state;
    }
}

export default notesApp
