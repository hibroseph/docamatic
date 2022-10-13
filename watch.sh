#!/bin/bash
# This prepares the dist directory for hot reloading when webpack is invoked with the --watch flag

echo "Cleaning dist/ of .js and .map files"

rm dist/*.js 2> /dev/null
rm dist/*.js.map 2> /dev/null

exit 0