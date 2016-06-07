'use strict';

var fs = require('fs');
var deepExtend = require('deep-extend');

var defaultConfig = {
    server: {
        baseUrl: 'http://localhost:8080',
        port: 8080,

        databaseFile: '/tmp/ffffng.sqlite',
        peersPath: '/tmp/peers',

        logging: {
            directory: '/tmp/logs',
            debug: false,
            logRequests: false
        },

        internal: {
            active: false,
            user: 'admin',
            password: 'secret'
        },

        email: {
            from: 'Freifunk Knotenformular <no-reply@musterstadt.freifunk.net>',

            // For details see: https://nodemailer.com/2-0-0-beta/setup-smtp/
            smtp: {
                host: 'mail.example.com',
                port: '465',
                secure: true,
                auth: {
                    user: 'user@example.com',
                    pass: 'pass'
                }
            }
        },

        map: {
            nodesJsonUrl: 'http://map.musterstadt.freifunk.net/nodes.json'
        }
    },
    client: {
        community: {
            name: 'Freifunk Musterstadt',
            domain: 'musterstadt.freifunk.net',
            contactEmail: 'kontakt@musterstadt.freifunk.net'
        },
        map: {
            mapUrl: 'http://map.musterstadt.freifunk.net'
        },
        monitoring: {
            enabled: false
        },
        coordsSelector: {
            showInfo: false,
            showBorderForDebugging: false,
            localCommunityPolygon: [],
            lat: 53.565278,
            lng: 10.001389,
            defaultZoom: 10
        }
    }
};

var configJSONFile = __dirname + '/../config.json';
var configJSON = {};

if (fs.existsSync(configJSONFile)) {
    configJSON = JSON.parse(fs.readFileSync(configJSONFile, 'utf8'));
}

var config = deepExtend({}, defaultConfig, configJSON);

module.exports = config;

angular.module('ffffng').constant('config', config);
