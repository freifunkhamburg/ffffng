'use strict';

angular.module('ffffng')
.service('MonitoringService', function ($http, $q) {
    return {
        'confirm': function (mac, token) {
            if (!mac || !token) {
                return $q.reject({});
            }
            return $http.put('/api/monitoring/confirm/' + mac + '?token=' + token);
        }
    };
});
