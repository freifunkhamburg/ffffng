'use strict';

angular.module('ffffng')
.directive('fFooter', function ($http, config) {
    var pathPrefix = config.rootPath === '/' ? '' : config.rootPath;

    var ctrl = function ($scope) {
        $scope.version = '?';
        $http.get(pathPrefix + '/api/version')
            .then(function (result) { $scope.version = result.data.version; });
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'templateUrl': 'views/directives/footer.html'
    };
});
