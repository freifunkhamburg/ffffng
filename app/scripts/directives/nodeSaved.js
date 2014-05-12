'use strict';

angular.module('ffffng')
.directive('fNodeSaved', function () {
    var ctrl = function ($scope, Navigator) {
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
