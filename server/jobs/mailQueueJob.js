'use strict';

angular.module('ffffng').factory('MailQueueJob', function (Database, MailService) {
    return {
        run: function () {
            MailService.sendPendingMails(function (err) {
                if (err) {
                    console.error(err);
                }
            });
        }
    };
});
