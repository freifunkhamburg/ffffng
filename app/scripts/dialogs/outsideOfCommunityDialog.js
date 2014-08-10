'use strict';

angular.module('ffffng')
.factory('OutsideOfCommunityDialog', function ($modal, config) {
    var ctrl = function ($scope, $modalInstance, action) {
        $scope.action = action;
        $scope.config = config;

        $scope.proceed = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    return {
        open: function (action) {
            return $modal.open({
                controller: ctrl,
                templateUrl: 'views/dialogs/outsideOfCommunityDialog.html',
                resolve: {
                    action: function () { return action; }
                }
            });
        }
    };
});
