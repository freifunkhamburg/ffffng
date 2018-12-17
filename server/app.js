'use strict';

const _ = require('lodash')
const auth = require('http-auth');
const bodyParser = require('body-parser');
const compress = require('compression');
const express = require('express');
const fs = require('graceful-fs')

const config = require('./config').config

const app = express();

module.exports = (() => {
    const router = express.Router();

    // urls beneath /internal are protected
    const internalAuth = auth.basic(
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

    const adminDir = __dirname + '/../admin';
    const clientDir = __dirname + '/../client';
    const templateDir = __dirname + '/templates';

    const jsTemplateFiles = [
        '/config.js'
    ];

    router.use(compress());

    function serveTemplate (mimeType, req, res, next) {
        return fs.readFile(templateDir + '/' + req.path, 'utf8', function (err, body) {
            if (err) {
                return next(err);
            }

            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(_.template(body)({ config: config.client }));

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
})()
