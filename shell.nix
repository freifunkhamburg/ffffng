with import <nixpkgs> {};
with pkgs;

stdenv.mkDerivation rec {
  name = "ffffng";
  version = "dev";

  buildInputs = [
    git
    nasm
    nodejs-16_x
    rsync
    sass
    sqlite
    yarn
    zlib
  ];

  nativeBuildInputs = [ autoreconfHook ];
}
