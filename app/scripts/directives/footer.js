'use strict';

angular.module('ffffng')
.directive('fFooter', function ($http) {
    var ctrl = function ($scope) {
        $scope.version = '?';
        $http.get('/api/version')
            .then(function (result) { $scope.version = result.data.version; })
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'templateUrl': 'views/directives/footer.html'
    };
});
