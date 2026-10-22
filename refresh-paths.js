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

// Note: don't rewrite anything inside the built .js files here. They are
// minified onto a single line, so any edit after webpack shifts every column
// after it and the source maps (used by Sentry) would point at the wrong code.

// update html

if (!fs.existsSync("./dist/site")){
  fs.mkdirSync("./dist/site")
}

fs.copyFileSync("./dist/homepage.html", "./dist/site/index.html")
fs.copyFileSync(`./dist/${assets["homepage.js"]}`, `./dist/site/${assets["homepage.js"]}`)
// The site's styles (design system, fonts, site.css), built from index.js
fs.copyFileSync(`./dist/${assets["homepage.css"]}`, "./dist/site/homepage.css")
fs.cpSync("./dist/css", "./dist/site/css", { recursive: true })

// The other pages aren't built by webpack: point their script tag at the
// bundle's hashed name
for (const page of ["changelog.html", "contactus.html", "privacy.html"]) {
  const html = fs.readFileSync(`./src/apps/homepage/${page}`, "utf8");
  fs.writeFileSync(`./dist/site/${page}`, html.replace('src="./homepage.js"', `src="./${assets["homepage.js"]}"`));
}
console.log("copying images")
if (!fs.existsSync("./dist/site/images")) {
  fs.mkdirSync("./dist/site/images");
}

fs.copyFileSync("./images/docamatic-logo.png", "./dist/site/images/docamatic-logo.png")
fs.copyFileSync("./images/docamatic-text-logo.png", "./dist/site/images/docamatic-text-logo.png")

console.log("Refreshed all paths and saved new manifest.json 👍");
