'use strict';

angular.module('ffffngAdmin')
.directive('faDashboardStats', function ($http, $state, notification, config) {
    var pathPrefix = config.rootPath === '/' ? '' : config.rootPath;

    var link = function (scope) {
        scope.stats = {};
        $http.get(pathPrefix + '/internal/api/statistics')
            .then(function (result) { scope.stats = result.data; })
            .catch(function (e) {
                notification.log('Error: ' + e.data, { addnCls: 'humane-flatty-error' });
                console.error(e);
            });
    };

    return {
        'link': link,
        'restrict': 'E',
        'scope': {},

        'templateUrl': 'views/dashboardStats.html'
    };
});
