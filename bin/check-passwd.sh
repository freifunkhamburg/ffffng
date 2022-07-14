#!/usr/bin/env bash

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

if [[ "$#" -ne 1 ]]; then
    echo "usage: check-passwd.sh '[password hash]'"
    exit 1
fi

password_hash="$1"

if ! [[ "$password_hash" =~ ^\$2[ab]\$[0-9]+\$.{53}$ ]]; then
    echo "Invalid password hash. Did you forget to quote it in '...'?"
    exit 1
fi

while :; do
    read -sp "Password: " password
    echo

    if node ./bcrypt.js "$password_hash" <<<"$password"; then
        break
    fi

    echo
    echo "Passwords do not match, try again."
    echo
done
