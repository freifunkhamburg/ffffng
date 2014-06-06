'use strict';

angular.module('ffffng').factory('app', function (fs) {
    var express = require('express');
    var app = express();

    app.use(express.bodyParser());

    var clientDir = __dirname + '/../client';

    app.use(express.compress());
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
