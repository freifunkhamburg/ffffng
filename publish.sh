#!/usr/bin/env bash

set -e

cd $(dirname $0)

version=$(grep '^ *"version": *"[^"]*" *, *$' package.json | cut -d '"' -f4)

if [ -z "$version" ]; then
    echo "Could not determine current version."
    exit 1
fi

echo "Current version: $version"

if [[ $version =~ 'SNAPSHOT' ]]; then
    echo "Will not publish SNAPSHOT version."
    exit 1
fi

./node_modules/.bin/grunt clean build

cd dist
npm publish

