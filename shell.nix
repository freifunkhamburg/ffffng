with import <nixpkgs> {};
with pkgs;

stdenv.mkDerivation rec {
  name = "ffffng";
  version = "dev";

  buildInputs = [
    compass
    git
    nasm
    nodejs-10_x
    sqlite
    zlib
  ];

  nativeBuildInputs = [ autoreconfHook ];
}
