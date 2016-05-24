'use strict';

var config = require('./config');


// Hack to allow proper logging of Error.
Object.defineProperty(Error.prototype, 'message', {
    configurable: true,
    enumerable: true
});
Object.defineProperty(Error.prototype, 'stack', {
    configurable: true,
    enumerable: true
});


var scribe = require('scribe-js')({
    rootPath: config.server.logging.directory,
});

if (config.server.logging.debug) {
    process.console.addLogger('debug', 'grey', {
        logInConsole: false
    });
} else {
    process.console.debug = function () {};
}

angular.module('ffffng').factory('Logger', function (app) {
    if (config.server.logging.logRequests) {
        app.use(scribe.express.logger());
    }
    app.use('/internal/logs', scribe.webPanel());

    return process.console;
});

module.exports = process.console;
