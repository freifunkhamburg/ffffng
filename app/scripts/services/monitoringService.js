'use strict';

angular.module('ffffng')
.service('MonitoringService', function ($http, $q, config) {
    var pathPrefix = config.rootPath === '/' ? '' : config.rootPath;

    return {
        'confirm': function (token) {
            if (!token) {
                return $q.reject({});
            }
            return $http.put(pathPrefix + '/api/monitoring/confirm/' + token);
        },

        'disable': function (token) {
            if (!token) {
                return $q.reject({});
            }
            return $http.put(pathPrefix + '/api/monitoring/disable/' + token);
        }
    };
});
