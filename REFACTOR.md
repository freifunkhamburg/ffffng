# Refactoring ideas

## TODO

* Test email rendering!

## Short term

* Split into seperate packages for server and frontend.
* Make admin panel part of new frontend package.
* Get rid of grunt.
* Use generated type guards.

## Mid term

* Typesafe db queries.
* Store node data in database and export it for gateways.
* Write tests (especially testing quirky node data).
* Allow terminating running tasks via bluebirds cancellation.

## Long term

* Rewrite the admin interface (used lib is unmaintained).
* Rewrite the client in typescript (+ vue?).
* Replace the grunt build system.
* Decentralize node data.
