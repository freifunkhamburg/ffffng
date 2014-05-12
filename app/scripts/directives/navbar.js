'use strict';

angular.module('ffffng')
.directive('fNavbar', function (Navigator) {
    var ctrl = function ($scope) {
        $scope.goHome = function () {
            Navigator.home();
        };
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'templateUrl': 'views/directives/navbar.html'
    };
});
