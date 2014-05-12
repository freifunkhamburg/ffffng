'use strict';

angular.module('ffffng')
.directive('fHelp', function () {
    var ctrl = function ($scope) {
        $scope.showHelp = false;

        $scope.toggleHelp = function () {
            $scope.showHelp = !$scope.showHelp;
        };
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'scope': {
            'text': '@'
        },
        'templateUrl': 'views/directives/help.html'
    };
});
