# Refactoring ideas

## Short term

* Integrate typescript in the build and start migrating the server code.

## Mid term

* Port complete server to typescript.
* Port the server code to promises and `async` / `await`.
* Use ES6 style imports instead of `require`.
* Store node data in database and export it for gateways.
* Write tests (especially testing quirky node data).

## Long term

* Rewrite the admin interface (used lib is unmaintained).
* Rewrite the client in typescript (+ vue?).
* Replace the grunt build system.
* Decentralize node data.
