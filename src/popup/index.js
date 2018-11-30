import React from 'react'
import Popup from './popup'

let root = document.getElementById("__POPUP__MOUNT__POINT__")

if (!root) {
    console.log("There is no root mount point for us :(")
} else {
    console.log("Yay, I found a mount point :)")
}

ReactDOM.render(
    <Popup></Popup>
)