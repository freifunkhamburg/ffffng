'use strict';

angular.module('ffffng').factory('MailQueueJob', function (MailService, Logger) {
    return {
        run: function (callback) {
            MailService.sendPendingMails(function (err) {
                if (err) {
                    Logger.tag('mail', 'queue').error('Error sending pending mails:', err);
                }

                callback();
            });
        }
    };
});
