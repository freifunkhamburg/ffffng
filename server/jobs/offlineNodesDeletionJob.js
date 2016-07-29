'use strict';

angular.module('ffffng').factory('OfflineNodesDeletionJob', function (MonitoringService, Logger) {
    return {
        description: 'Delete nodes that are offline for more than 100 days.',

        run: function (callback) {
            MonitoringService.deleteOfflineNodes(function (err) {
                if (err) {
                    Logger.tag('nodes', 'delete-offline').error('Error deleting offline nodes:', err);
                }

                callback();
            });
        }
    };
});
