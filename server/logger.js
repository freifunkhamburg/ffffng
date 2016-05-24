'use strict';

var config = require('./config');

var scribe = require('scribe-js')({
    app: 'ffffng',
    id: process.pid,

    rootPath: config.server.logging.directory,

    module: {
        'router/Viewer': {
            username: false,
            password: false
        }
    }
});

process.console.addLogger('debug', 'grey', {
    logInConsole: false
});

angular.module('ffffng').factory('Logger', function (app) {
    app.use(scribe.express.logger());
    app.use('/internal/logs', scribe.webPanel());

    return process.console;
});

module.exports = process.console;
