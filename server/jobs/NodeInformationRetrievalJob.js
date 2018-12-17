'use strict';

const Logger = require('../logger')
const MonitoringService = require('../services/monitoringService')

module.exports = {
    description: 'Fetches the nodes.json and calculates and stores the monitoring / online status for registered nodes.',

    run: function (callback) {
        MonitoringService.retrieveNodeInformation(function (err) {
            if (err) {
                Logger.tag('monitoring', 'information-retrieval').error('Error retrieving node data:', err);
            }

            callback();
        });
    }
}
