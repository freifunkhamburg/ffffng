'use strict';

angular.module('ffffng')
.controller('NewNodeCtrl', function ($scope, Navigator, NodeService, $routeParams, _, config) {
    $scope.config = config;

    $scope.node = {};
    $scope.saved = false;

    _.each(['hostname', 'key', 'mac'], function (field) {
        var value = $routeParams[field];
        if (value) {
            $scope.node[field] = value;
        }
    });

    $scope.save = function (node) {
        return NodeService.createNode(node)
            .then(function (response) {
                $scope.node = response.data.node;
                $scope.token = response.data.token;
                $scope.saved = true;
            });
    };

    $scope.cancel = function () {
        Navigator.home();
    };
});
