'use strict';

angular.module('ffffng')
.directive('fNodeSaved', function (config) {
    var ctrl = function ($scope, Navigator) {
        $scope.config = config;

        $scope.goHome = function () {
            Navigator.home();
        };
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'scope': {
            'node': '=fNode',
            'token': '=fToken'
        },
        'templateUrl': 'views/directives/nodeSaved.html'
    };
});
