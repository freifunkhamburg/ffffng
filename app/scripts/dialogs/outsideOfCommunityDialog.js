'use strict';

angular.module('ffffng')
.factory('OutsideOfCommunityDialog', function ($uibModal, config) {
    var ctrl = function ($scope, $uibModalInstance, action) {
        $scope.action = action;
        $scope.config = config;

        $scope.proceed = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    };

    return {
        open: function (action) {
            return $uibModal.open({
                controller: ctrl,
                templateUrl: 'views/dialogs/outsideOfCommunityDialog.html',
                resolve: {
                    action: function () { return action; }
                }
            });
        }
    };
});
