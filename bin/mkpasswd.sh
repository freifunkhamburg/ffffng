#!/usr/bin/env bash

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

while :; do
    read -sp "Password: " password
    echo

    read -sp "Confirm:  " confirmation
    echo

    if [[ "$password" == "$confirmation" ]]; then
        break
    fi

    echo
    echo "Passwords do not match, try again."
    echo
done

exec node ./bcrypt.js <<<"$password"
