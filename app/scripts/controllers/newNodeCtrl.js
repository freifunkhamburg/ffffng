'use strict';

angular.module('ffffng')
.controller('NewNodeCtrl', function ($scope, Navigator, NodeService, $routeParams, _) {
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
