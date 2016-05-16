'use strict';

angular.module('ffffng')
.factory('ConfirmDeletionDialog', function ($uibModal, config) {
    var ctrl = function ($scope, $uibModalInstance, node) {
        $scope.node = node;
        $scope.config = config;

        $scope.proceed = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    };

    return {
        open: function (node) {
            return $uibModal.open({
                controller: ctrl,
                templateUrl: 'views/dialogs/confirmDeletionDialog.html',
                resolve: {
                    node: function () { return node; }
                }
            });
        }
    };
});
