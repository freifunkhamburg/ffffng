'use strict';

angular.module('ffffng')
.controller('UpdateNodeCtrl', function ($scope, Navigator, NodeService, config) {
    $scope.config = config;
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
            .then(function (response) {
                $scope.node = response.data.node;
                $scope.token = response.data.token;
                $scope.saved = true;
            });
    };

    $scope.cancel = function () {
        Navigator.home();
    };

    if (window.__nodeToken) {
        var token = window.__nodeToken;
        window.__nodeToken = undefined;
        $scope.onSubmitToken(token);
    }
});
