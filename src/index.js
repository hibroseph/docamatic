import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import notesApp from './reducer';

// See if we have previously saved a state and if not, insert an empty array
let initialState = JSON.parse(localStorage.getItem('state') || '{"notes" : []}') 

console.log(initialState)

// initialState = {notes: []}
// Create the store
const store = createStore(notesApp, initialState) 

store.subscribe(()=>{ 
    const serialized = JSON.stringify(store.getState()); 
    localStorage.setItem('state', serialized) 
    console.log("New state:")
    console.log(store.getState())
})

//
ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.unregister();
