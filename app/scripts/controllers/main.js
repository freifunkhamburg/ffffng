'use strict';

angular.module('ffffng')
.controller('MainCtrl', function ($scope, Navigator) {
    $scope.newNode = function () {
        Navigator.newNode();
    };

    $scope.updateNode = function () {
        Navigator.updateNode();
    };
});
