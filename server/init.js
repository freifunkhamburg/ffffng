'use strict';

(function () {
    // Use graceful-fs instead of fs also in all libraries to have more robust fs handling.
    const realFs = require('fs');
    const gracefulFs = require('graceful-fs');
    gracefulFs.gracefulify(realFs);
})();
