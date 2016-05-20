'use strict';

var fs = require('fs');
var deepExtend = require('deep-extend');

var defaultConfig = {
    server: {
        baseUrl: 'http://localhost:8080',
        port: 8080,

        databaseFile: '/tmp/ffffng.sqlite',
        peersPath: '/tmp/peers',

        email: {
            from: 'no-reply@musterstadt.freifunk.net'
        }
    },
    client: {
        community: {
            name: 'Freifunk Musterstadt',
            domain: 'musterstadt.freifunk.net',
            contactEmail: 'kontakt@musterstadt.freifunk.net'
        },
        map: {
            graphUrl: 'http://graph.musterstadt.freifunk.net/graph.html',
            mapUrl: 'http://graph.musterstadt.freifunk.net/geomap.html'
        },
        monitoring: {
            enabled: true
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

angular.module('ffffng').factory('config', function () {
    return config;
});
