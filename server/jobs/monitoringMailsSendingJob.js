'use strict';

angular.module('ffffng').factory('MonitoringMailsSendingJob', function (MonitoringService, Logger) {
    return {
        description: 'Sends monitoring emails depending on the monitoring state of nodes retrieved by the NodeInformationRetrievalJob.',

        run: function (callback) {
            MonitoringService.sendMonitoringMails(function (err) {
                if (err) {
                    Logger.tag('monitoring', 'mail-sending').error('Error sending monitoring mails:', err);
                }

                callback();
            });
        }
    };
});
