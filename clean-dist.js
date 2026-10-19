// Removes old bundles from dist/ before webpack builds. The bundle names
// contain a content hash, so without this every rebuild would leave the
// previous .js/.map files behind.
// (Replaces watch.sh, which can't run on Windows.)
"use strict";
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "dist");

if (fs.existsSync(dist)) {
  for (const file of fs.readdirSync(dist)) {
    if (file.endsWith(".js") || file.endsWith(".js.map")) {
      fs.rmSync(path.join(dist, file));
    }
  }
}
