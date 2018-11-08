import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import notesApp from './reducer';
import App from './App'

// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem('state') || '{"notes" : []}')

// This is used to reset the state if something is saved as undefined
// initialState = {notes:[]}

// Create the store
const store = createStore(notesApp, initialState)

store.subscribe(() => {
    const serialized = JSON.stringify(store.getState());
    localStorage.setItem('state', serialized)
    console.log(store.getState())
})

console.log("Inital state: ")
console.log(store.getState())

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.unregister();
