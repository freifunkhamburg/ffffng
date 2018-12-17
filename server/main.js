#!/usr/bin/env node
/*jslint node: true */
'use strict';

(function () {
    // Use graceful-fs instead of fs also in all libraries to have more robust fs handling.
    const realFs = require('fs');
    const gracefulFs = require('graceful-fs');
    gracefulFs.gracefulify(realFs);
})();

const config = require('./config').config;

const Logger = require('./logger')
Logger.tag('main', 'startup').info('Server starting up...');

require('./db/database').init()
.then(() => {
    Logger.tag('main').info('Initializing...');

    const app = require('./app');

    require('./jobs/scheduler').init();
    require('./router').init();

    app.listen(config.server.port, '::');
    module.exports = app;
})
.catch(error => {
    console.error('Could not init database: ', error);
    process.exit(1);
});
