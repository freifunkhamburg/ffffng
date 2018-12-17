'use strict';

const Logger = require('../logger')
const MonitoringService = require('../services/monitoringService')

module.exports =  {
    description: 'Delete nodes that are offline for more than 100 days.',

    run: function (callback) {
        MonitoringService.deleteOfflineNodes(function (err) {
            if (err) {
                Logger.tag('nodes', 'delete-offline').error('Error deleting offline nodes:', err);
            }

            callback();
        });
    }
}
