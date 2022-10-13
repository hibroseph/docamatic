#!/bin/bash

if [ $# -ne 2 ]; then
        echo "You must pass a semver number of the build and the environment [production or uat]"
        exit 1;
fi

# verify second parm is either production or uat
if [ "$2" != production ] && [ "$2" != uat ]; then
        echo "production or uat are only valid arguments for 2nd parameter"
        exit 1;
fi
#verify first parm is semver number
rx='^([0-9]+\.){0,2}(\*|[0-9]+)$'
if [[ $1 =~ $rx ]]; then
    echo "Creating a $2 build with semver $1"
else
    echo "$1 is not a valid semver number"
    exit 1;
fi


# replace version numbers in manifest and config.json
jq '.version=$number' --arg number $1 manifest.json > tmp_manifest.json
jq '.name="Docamatic - Add Sticky Notes to the Web"' tmp_manifest.json > manifest.json
rm tmp_manifest.json

jq '.version=$number' --arg number $1 config.json > tmp_config.json
jq '.environment="$2"' tmp_config.json > config.json
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

echo "Done creating the $2 build with semver version" $1