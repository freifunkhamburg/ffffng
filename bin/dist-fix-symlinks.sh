#!/usr/bin/env bash

set -e

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "Fixing symlinks in dist:"

if [[ ! -d "dist" ]]; then
    echo "    Error: Directory dist does not exist."
    exit 1
fi

cd dist

find . -type l | while read symlink; do
    target=$(readlink -e "$symlink")
    if [[ -z "$target" ]] || [[ ! -f "$target" ]]; then
        echo "   Could not resolve symlink in dist: $symlink"
        exit 1
    fi

    echo "    $symlink"
    rsync "$target" "$symlink" -az --copy-links
done

echo "Done"
