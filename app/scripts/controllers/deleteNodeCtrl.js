'use strict';

angular.module('ffffng')
.controller('DeleteNodeCtrl', function ($scope, Navigator, NodeService, config, ConfirmDeletionDialog) {
    $scope.config = config;
    $scope.token = undefined;
    $scope.deleted = false;

    $scope.onSubmitToken = function (token) {
        $scope.token = token;
        return NodeService.getNode(token)
            .then(function (response) {
                var node = response.data;
                ConfirmDeletionDialog.open(node).result.then(function () {
                    NodeService.deleteNode(token)
                        .then(function () {
                            $scope.deleted = true;
                            $scope.hostname = node.hostname;
                        });
                });
            });
    };

    $scope.cancel = function () {
        Navigator.home();
    };
});
