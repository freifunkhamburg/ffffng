'use strict';

angular.module('ffffng')
.controller('ConfirmMonitoringCtrl', function ($scope, Navigator, MonitoringService, $routeParams, config) {
    if (!config.monitoring.enabled) {
        Navigator.home();
        return;
    }

    $scope.config = config;

    $scope.monitoringInfo = {};
    $scope.monitoringStatus = 'loading';

    MonitoringService.confirm($routeParams['token'])
        .then(
            function (response) {
                // success
                $scope.monitoringInfo = response.data;
                $scope.monitoringStatus = 'confirmed';
            },
            function () {
                // error
                $scope.monitoringStatus = 'error';
            }
        );

    $scope.goHome = function () {
        Navigator.home();
    };

    $scope.goToUpdate = function () {
        Navigator.updateNode();
    };
});
