'use strict';

angular.module('ffffng')
.service('MonitoringService', function ($http, $q) {
    return {
        'confirm': function (token) {
            if (!token) {
                return $q.reject({});
            }
            return $http.put('/api/monitoring/confirm/' + token);
        },

        'disable': function (token) {
            if (!token) {
                return $q.reject({});
            }
            return $http.put('/api/monitoring/disable/' + token);
        }
    };
});
