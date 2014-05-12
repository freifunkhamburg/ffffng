'use strict';

angular.module('ffffng')
.controller('UpdateNodeCtrl', function ($scope, Navigator, NodeService) {
    $scope.node = undefined;
    $scope.token = undefined;
    $scope.saved = false;

    $scope.hasData = function () {
        return $scope.node !== undefined;
    };

    $scope.onSubmitToken = function (token) {
        $scope.token = token;
        return NodeService.getNode(token)
            .success(function (node) {
                $scope.node = node;
            });
    };

    $scope.save = function (node) {
        return NodeService.updateNode(node, $scope.token)
            .success(function (response) {
                $scope.node = response.node;
                $scope.token = response.token;
                $scope.saved = true;
            });
    };

    $scope.cancel = function () {
        Navigator.home();
    };
});
