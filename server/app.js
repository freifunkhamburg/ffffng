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
    app.get('/', function (req, res, next) {
        fs.readFile(clientDir + '/index.html', 'utf8', function (err, body) {
            if (err) {
                return next(err);
            }

            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(body);

            return next();
        });
    });

    return app;
});
