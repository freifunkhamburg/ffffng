'use strict';

angular.module('ffffng')
.factory('config', function () {
    return {
        community: {
            name: 'Freifunk Hamburg',
            domain: 'hamburg.freifunk.net',
            contactEmail: 'kontakt@hamburg.freifunk.net'
        },
        map: {
            graphUrl: 'http://graph.hamburg.freifunk.net/graph.html',
            mapUrl: 'http://graph.hamburg.freifunk.net/geomap.html'
        },
        coordsSelector: {
            lat: 53.565278,
            lng: 10.001389,
            defaultZoom: 10
        }
    };
});
