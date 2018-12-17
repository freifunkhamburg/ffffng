'use strict';

const Logger = require('../logger')
const MailService = require('../services/mailService')

module.exports = {
    description: 'Send pending emails (up to 5 attempts in case of failures).',

    run: function (callback) {
        MailService.sendPendingMails(function (err) {
            if (err) {
                Logger.tag('mail', 'queue').error('Error sending pending mails:', err);
            }

            callback();
        });
    }
}
