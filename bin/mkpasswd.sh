#!/usr/bin/env bash

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

function hash() {
    local password="$1"
    node ./bcrypt.js <<<"$password"
}

function check() {
    local password="$1"
    local hash="$2"
    node ./bcrypt.js "$hash" <<<"$password" > /dev/null
}

while :; do
    read -sp "Password: " password
    echo

    if [[ -z "$password" ]]; then
        echo
        echo "Your input was empty. Pleas provide a password."
        echo
        continue
    fi

    read -sp "Confirm:  " confirmation
    echo

    if ! [[ "$password" == "$confirmation" ]]; then
        echo
        echo "Passwords do not match, try again."
        echo
        continue
    fi

    password_hash=$(hash "$password")
    if check "$password" "$password_hash"; then
        break
    fi

    echo
    echo "Failed to verify password after hashing. This should not happen."
    echo
done

echo
echo "$password_hash"
