'use strict';

angular.module('ffffng').factory('app', function (fs) {
    var express = require('express');
    var bodyParser = require('body-parser');
    var compress = require('compression');

    var app = express();

    app.use(bodyParser());

    var clientDir = __dirname + '/../client';

    app.use(compress());
    app.use('/', express.static(clientDir + '/'));

    return app;
});
