import React from "react";
import Popup from "./popup";

let root = document.getElementById("__POPUP__MOUNT__POINT__");

if (!root) {
  console.log("There is no root mount point for us :(");
  root = document.createElement("div");

  document.body.appendChild(root);
} else {
  console.log("Yay, I found a mount point :)");
}

ReactDOM.render(
  <Provider>
    <Popup />
  </Provider>,
  root
);
