'use strict';

angular.module('ffffngAdmin')
.directive('faDashboardStats', function ($http, $state, notification) {
    var link = function (scope) {
        scope.stats = {};
        $http.get('/internal/api/statistics')
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
