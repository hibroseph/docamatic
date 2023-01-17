// This is a simple script to take in a manifest.json in the root directory
// and replace some of the filenames with the hashed filenames. It uses the
// assetManifest which is left in the /dist/ directory.
"use strict";
const fs = require("fs");

let assetData = fs.readFileSync("./dist/assetManifest.json");
let manifestData = fs.readFileSync("./manifest.json");

let manifest = JSON.parse(manifestData);
let assets = JSON.parse(assetData);

let assetKeys = Object.keys(assets);

let manifestString = JSON.stringify(manifest);

// loop through all keys
for (let i = 0, length = assetKeys.length; i < length; i++) {
  manifestString = manifestString.replace(assetKeys[i], assets[assetKeys[i]]);
}

// update manifest.json
fs.writeFileSync("./dist/manifest.json", manifestString);

// update popup.js
let popupFile = fs.readFileSync(`./dist/${assets["popup.js"]}`).toString()
fs.writeFileSync(`./dist/${assets["popup.js"]}`, popupFile.replace("[[script.js]]", assets["script.js"]))

// Update background.js file
let backgroundFile = fs.readFileSync(`./dist/${assets["background.js"]}`).toString();
fs.writeFileSync(`./dist/${assets["background.js"]}`, backgroundFile.replace("[[script.js]]", assets["background.js"]))

// update html

if (!fs.existsSync("./dist/site")){
  fs.mkdirSync("./dist/site")
}

/*let homepage = fs.readFileSync(`./site/index.html`).toString();
fs.writeFileSync(`./dist/site/index.html`, homepage.replace("[[script.js]]", assets["script.js"]))*/

fs.copyFileSync("./dist/homepage.html", "./dist/site/index.html")
fs.copyFileSync(`./dist/${assets["homepage.js"]}`, `./dist/site/${assets["homepage.js"]}`)

fs.copyFileSync("./src/apps/homepage/styles.css", "./dist/site/styles.css")
fs.copyFileSync("./src/apps/homepage/changelog.html", "./dist/site/changelog.html")
fs.copyFileSync("./src/apps/homepage/contactus.html", "./dist/site/contactus.html")
console.log("copying images")
if (!fs.existsSync("./dist/site/images")) {
  fs.mkdirSync("./dist/site/images");
}

fs.copyFileSync("./images/docamatic-logo.png", "./dist/site/images/docamatic-logo.png")
fs.copyFileSync("./images/docamatic-text-logo.png", "./dist/site/images/docamatic-text-logo.png")

console.log("Refreshed all paths and saved new manifest.json 👍");
