#!/usr/bin/env bash

set -e

function confirm() {
    msg="$1 [y/n] "

    echo -n $msg

    while read -n1 c; do
        echo

        if [ "$c" == "y" ]; then
            return 0
        fi

        if [ "$c" == "n" ]; then
            return 1
        fi

        echo -n $msg
    done
}

cd "$(dirname "${BASH_SOURCE[0]}")"

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

echo

if confirm "Continue publishing?"; then
    yarn run dist

    cd dist
    yarn publish --new-version "$version"
fi
