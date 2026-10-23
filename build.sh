#!/bin/bash
# Release build, run by the "build extension" workflow. Produces:
#   dist/app.zip          the Chrome extension (uploaded to the Web Store)
#   dist/app-firefox.zip  the Firefox build (not published yet)
#   dist/sentry/          bundles + source maps for Sentry (never shipped)
#   dist/homepage/        the website
set -euo pipefail

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

# The manifest version comes from package.json (WXT); config.json gives the
# same version and the environment to Sentry and analytics
jq '.version=$number' --arg number "$1" package.json > tmp_package.json
mv tmp_package.json package.json

jq '.version=$number' --arg number "$1" config.json > tmp_config.json
jq '.environment=$env' --arg env "$2" tmp_config.json > config.json
rm tmp_config.json

rm -rf dist/
npx wxt build
npx wxt build -b firefox
npx vite build --config site/vite.config.ts

# Give each bundle and its source map a matching debug id. Sentry uses it to
# find the right source map for a stack trace, independent of the extension
# id or file names. This must happen before the bundles are copied/zipped.
npx sentry-cli sourcemaps inject ./dist/chrome-mv3

cd dist

# Bundles + source maps for Sentry. The maps are not shipped in the extension.
cp -r chrome-mv3 sentry
find sentry -type f ! -name '*.js' ! -name '*.map' -delete

mkdir app
cp -r chrome-mv3/. app/
find app -name '*.map' -delete
zip -r app.zip app/

(cd firefox-mv3 && find . -name '*.map' -delete && zip -r ../app-firefox.zip .)

mkdir homepage
cp -r site/* homepage/

echo "Done creating the $2 build with semver version" $1
