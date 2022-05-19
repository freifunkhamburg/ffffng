function wrap() {
    local TOOL="$1"
    local REPO="$2"
    shift
    shift

    SHELL_NIX="$REPO/shell.nix"
    QUOTED_ARGS="$(printf "${1+ %q}" "$@")"
    exec nix-shell "$SHELL_NIX" --pure --run "$TOOL $QUOTED_ARGS"
}
