// This is a simple script to take in a manifest.json in the root directory
// and replace some of the filenames with the hashed filenames. It uses the
// assetManifest which is left in the /dist/ directory.
"use strict";
const fs = require("fs");

let assetData = fs.readFileSync("./dist/assetManifest.json");
let manifestData = fs.readFileSync("./src/manifest.json");

let manifest = JSON.parse(manifestData);
let assets = JSON.parse(assetData);

let assetKeys = Object.keys(assets);

let manifestString = JSON.stringify(manifest);

// loop through all keys
for (let i = 0, length = assetKeys.length; i < length; i++) {
  manifestString = manifestString.replace(assetKeys[i], assets[assetKeys[i]]);
}

fs.writeFileSync("./dist/manifest.json", manifestString);

console.log("Refreshed all paths and saved new manifest.json 👍");
