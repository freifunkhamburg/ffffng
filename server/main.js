/*jslint node: true */
'use strict';

// Dirty hack to allow usage of angular modules.
global.angular = require('ng-di');

angular.module('ffffng', []);

require('./config');

require('./app');
require('./router');
require('./libs');

require('./utils/errorTypes');
require('./utils/strings');

require('./resources/nodeResource');

require('./services/nodeService');

require('../shared/validation/constraints');
require('./validation/validator');

angular.injector(['ffffng']).invoke(function (config, app, Router) {
    Router.init();

    app.listen(config.server.port, '::');
    module.exports = app;
});
