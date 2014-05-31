'use strict';

angular.module('ffffng')
.controller('MainCtrl', function ($scope, Navigator, config) {
    $scope.config = config;

    $scope.newNode = function () {
        Navigator.newNode();
    };

    $scope.updateNode = function () {
        Navigator.updateNode();
    };
});
