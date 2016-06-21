#!/usr/bin/env node
/*jslint node: true */
'use strict';

// Dirty hack to allow usage of angular modules.
global.angular = require('ng-di');

angular.module('ffffng', []);

(function () {
    // Use graceful-fs instead of fs also in all libraries to have more robust fs handling.
    var realFs = require('fs');
    var gracefulFs = require('graceful-fs');
    gracefulFs.gracefulify(realFs);
})();

require('./config');

require('./logger').tag('main', 'startup').info('Server starting up...');

require('./app');
require('./router');
require('./libs');

require('./utils/errorTypes');
require('./utils/resources');
require('./utils/strings');
require('./utils/urlBuilder');

require('./resources/frontendResource');
require('./resources/taskResource');
require('./resources/mailResource');
require('./resources/nodeResource');
require('./resources/monitoringResource');

require('./services/mailService');
require('./services/mailTemplateService');
require('./services/nodeService');
require('./services/monitoringService');

require('../shared/validation/constraints');
require('./validation/validator');

require('./jobs/scheduler');

var db = require('./db/database');

db.init(function () {
    angular.injector(['ffffng']).invoke(function (config, app, Logger, Scheduler, Router) {
        Logger.tag('main').info('Initializing...');

        Scheduler.init();
        Router.init();

        app.listen(config.server.port, '::');
        module.exports = app;
    });
});
