'use strict';

angular.module('ffffng').factory('NodeInformationRetrievalJob', function (MonitoringService, Logger) {
    return {
        run: function (callback) {
            MonitoringService.retrieveNodeInformation(function (err) {
                if (err) {
                    Logger.tag('monitoring', 'information-retrieval').error('Error retrieving node data:', err);
                }

                callback();
            });
        }
    };
});
