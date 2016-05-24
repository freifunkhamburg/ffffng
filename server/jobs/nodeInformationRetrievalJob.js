'use strict';

angular.module('ffffng').factory('NodeInformationRetrievalJob', function (MonitoringService) {
    return {
        run: function () {
            MonitoringService.retrieveNodeInformation(function (err) {
                if (err) {
                    console.error(err);
                }
            });
        }
    };
});
