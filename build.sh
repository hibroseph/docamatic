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

# package.json too, so all three always report the same version
jq '.version=$number' --arg number $1 package.json > tmp_package.json
mv tmp_package.json package.json

jq '.version=$number' --arg number $1 config.json > tmp_config.json
jq '.environment=$env' --arg env $2 tmp_config.json > config.json
rm tmp_config.json

#start production build
rm -rf app.zip
rm -rf dist/
rm -rf app/
npx webpack --mode=production

# Give each bundle and its source map a matching debug id. Sentry uses it to
# find the right source map for a stack trace, independent of the extension
# id or file names. This must happen before the bundles are copied/zipped.
npx sentry-cli sourcemaps inject ./dist

cd dist

mkdir app
cp *.js app
cp index.html app
cp onboarding.html app
cp offscreen.html app
cp options.html app
cp -r assets app
# The welcome page's styles and the fonts they use
cp *.css app
cp -r css app
cp manifest.json app
cp -r icons app

# Bundles + source maps for Sentry. The maps are not shipped in the extension.
mkdir sentry
cp *.js sentry
cp *.map sentry

mkdir homepage
cp -r site/* homepage/

zip -r app.zip app/

echo "Done creating the $2 build with semver version" $1