with import <nixpkgs> {};
with pkgs;

stdenv.mkDerivation rec {
  name = "ffffng";
  version = "dev";

  buildInputs = [
    compass
    git
    nasm
    nodejs-16_x
    rsync
    sqlite
    yarn
    zlib
  ];

  nativeBuildInputs = [ autoreconfHook ];
}
