'use strict';

angular.module('ffffng').factory('config', function () {
    return {
        port: 8080,
        peersPath: '/tmp/peers'
    };
});
