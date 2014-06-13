'use strict';

angular.module('ffffng').factory('config', function (fs, deepExtend) {
    var defaultConfig = {
        server: {
            port: 8080,
            peersPath: '/tmp/peers'
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
            coordsSelector: {
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

    return deepExtend({}, defaultConfig, configJSON);
});
