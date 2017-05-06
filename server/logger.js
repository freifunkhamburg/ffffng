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

function addLogger(name, color, active) {
    if (active) {
        process.console.addLogger(name, color, {
            logInConsole: false
        });
    } else {
        process.console[name] = function () {
            this._reset(); // forget tags, etc. for this logging event
        };
    }
}

addLogger('debug', 'grey', config.server.logging.debug);
addLogger('profile', 'blue', config.server.logging.profile);

angular.module('ffffng').factory('Logger', function (app) {
    if (config.server.logging.logRequests) {
        app.use(scribe.express.logger());
    }
    if (config.server.internal.active) {
        var prefix = config.server.rootPath === '/' ? '' : config.server.rootPath;
        app.use(prefix + '/internal/logs', scribe.webPanel());
    }

    return process.console;
});

module.exports = process.console;
