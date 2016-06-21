'use strict';

angular.module('ffffng').factory('NodeInformationRetrievalJob', function (MonitoringService, Logger) {
    return {
        description: 'Fetches the nodes.json and calculates and stores the monitoring status for nodes with active monitoring.',

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
