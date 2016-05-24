'use strict';

angular.module('ffffng').factory('app', function (fs, config, _) {
    var express = require('express');
    var auth = require('http-auth');
    var bodyParser = require('body-parser');
    var compress = require('compression');

    var app = express();

    // urls beneath /internal are protected
    var internalAuth = auth.basic(
        {
            realm: "Knotenformular - Intern"
        },
        function (username, password, callback) {
            callback(
                config.server.internal.active &&
                username === config.server.internal.user &&
                password === config.server.internal.password
            );
        }
    );
    app.use('/internal', auth.connect(internalAuth));

    app.use(bodyParser.json());

    var clientDir = __dirname + '/../client';
    var templateDir = __dirname + '/templates';

    var jsTemplateFiles = [
        '/config.js'
    ];

    app.use(compress());

    function serveTemplate(mimeType, req, res, next) {
        return fs.readFile(templateDir + '/' + req.path, 'utf8', function (err, body) {
            if (err) {
                return next(err);
            }

            res.writeHead(200, {'Content-Type': mimeType});
            res.end(_.template(body)( { config: config.client }));

            return null; // to suppress warning
        });
    }

    app.use(function (req, res, next) {
        if (jsTemplateFiles.indexOf(req.path) >= 0) {
            return serveTemplate('application/javascript', req, res, next);
        }
        return next();
    });

    app.use('/', express.static(clientDir + '/'));

    return app;
});
