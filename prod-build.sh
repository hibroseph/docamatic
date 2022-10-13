#!/bin/bash

if [ $# -eq 0 ]
    then
        echo "You must pass a version number of the production build"
        exit 1;
fi

echo "Creating a production build with version number" $1


# replace version numbers in manifest and config.json
jq '.version=$number' --arg number $1 manifest.json > tmp_manifest.json
jq '.name="Docamatic - Add Sticky Notes to the Web"' tmp_manifest.json > manifest.json
rm tmp_manifest.json

jq '.version=$number' --arg number $1 config.json > tmp_config.json
jq '.environment="production"' tmp_config.json > config.json
rm tmp_config.json

#start production build
rm -rf app.zip
rm -rf dist/
npx webpack --mode=production

cd dist

mkdir app
cp *.js app
cp index.html app
cp -r assets app
cp manifest.json app
cp -r icons app

mkdir sentry
cp *.js sentry
cp *.map sentry
cp manifest sentry

zip -r app.zip app/

echo "Done creating the production build with version number" $1