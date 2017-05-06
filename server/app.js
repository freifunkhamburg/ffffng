'use strict';

angular.module('ffffng').factory('app', function (fs, config, _) {
    var express = require('express');
    var auth = require('http-auth');
    var bodyParser = require('body-parser');
    var compress = require('compression');

    var app = express();
    var router = express.Router();

    // urls beneath /internal are protected
    var internalAuth = auth.basic(
        {
            realm: 'Knotenformular - Intern'
        },
        function (username, password, callback) {
            callback(
                config.server.internal.active &&
                username === config.server.internal.user &&
                password === config.server.internal.password
            );
        }
    );
    router.use('/internal', auth.connect(internalAuth));

    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));

    var adminDir = __dirname + '/../admin';
    var clientDir = __dirname + '/../client';
    var templateDir = __dirname + '/templates';

    var jsTemplateFiles = [
        '/config.js'
    ];

    router.use(compress());

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

    router.use(function (req, res, next) {
        if (jsTemplateFiles.indexOf(req.path) >= 0) {
            return serveTemplate('application/javascript', req, res, next);
        }
        return next();
    });

    router.use('/internal/admin', express.static(adminDir + '/'));
    router.use('/', express.static(clientDir + '/'));

    app.use(config.server.rootPath, router);

    return app;
});
