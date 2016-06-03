'use strict';

angular.module('ffffng').factory('MonitoringMailsSendingJob', function (MonitoringService, Logger) {
    return {
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
