#!/bin/bash

echo "Creating development build"

# replace version numbers in manifest and config.json
jq '.name="[DEV] Docamatic - Add Sticky Notes to the Web"' manifest.json > tmp_manifest.json
mv tmp_manifest.json manifest.json

jq '.environment="development"' config.json > tmp_config.json
mv tmp_config.json config.json

echo "Done creating development build"