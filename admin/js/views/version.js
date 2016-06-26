'use strict';

angular.module('ffffngAdmin')
.directive('faVersion', function ($http, $state, notification) {
    var link = function (scope) {
        scope.version = '?';
        $http.get('/internal/api/version')
            .then(function (result) { scope.version = result.data.version; })
            .catch(function (e) {
                notification.log('Error: ' + e.data, { addnCls: 'humane-flatty-error' });
                console.error(e);
            });
    };

    return {
        'link': link,
        'restrict': 'E',
        'scope': {},

        'template': '{{version}}'
    };
});
