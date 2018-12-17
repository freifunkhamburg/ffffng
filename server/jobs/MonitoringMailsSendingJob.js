'use strict';

const Logger = require('../logger')
const MonitoringService = require('../services/monitoringService')

module.exports = {
    description: 'Sends monitoring emails depending on the monitoring state of nodes retrieved by the NodeInformationRetrievalJob.',

    run: function (callback) {
        MonitoringService.sendMonitoringMails(function (err) {
            if (err) {
                Logger.tag('monitoring', 'mail-sending').error('Error sending monitoring mails:', err);
            }

            callback();
        });
    }
}
