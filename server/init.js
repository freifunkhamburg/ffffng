'use strict';

(function () {
    // Use graceful-fs instead of fs also in all libraries to have more robust fs handling.
    const realFs = require('fs');
    const gracefulFs = require('graceful-fs');
    gracefulFs.gracefulify(realFs);

    // Init config by parsing commandline. Afterwards all other imports may happen.
    require('./config').parseCommandLine();
})();
