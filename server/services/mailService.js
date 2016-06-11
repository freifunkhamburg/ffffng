'use strict';

angular.module('ffffng')
.service('MailService', function (
        Database,
        MailTemplateService,
        config,
        _,
        async,
        deepExtend,
        fs,
        moment,
        Logger,
        Resources
) {
    var MAIL_QUEUE_DB_BATCH_SIZE = 50;
    var MAIL_QUEUE_MAX_PARALLEL_SENDING = 3;

    var transporter = require('nodemailer').createTransport(deepExtend(
        {},
        config.server.email.smtp,
        {
            transport: 'smtp',
            pool: true
        }
    ));

    MailTemplateService.configureTransporter(transporter);

    function sendMail(options, callback) {
        Logger
            .tag('mail', 'queue')
            .info(
                'Sending pending mail[%d] of type %s. ' +
                'Had %d failures before.',
                options.id, options.email, options.failures
            );

        MailTemplateService.render(options, function (err, renderedTemplate) {
                if (err) {
                    return callback(err);
                }

                var mailOptions = {
                    from: options.sender,
                    to: options.recipient,
                    subject: renderedTemplate.subject,
                    html: renderedTemplate.body
                };

                transporter.sendMail(mailOptions, function (err) {
                    if (err) {
                        return callback(err);
                    }

                    Logger.tag('mail', 'queue').info('Mail[%d] has been send.', options.id);

                    callback(null);
                });
            }
        );
    }

    function findPendingMailsBefore(beforeMoment, limit, callback) {
        Database.all(
            'SELECT * FROM email_queue WHERE modified_at < ? AND failures < ? ORDER BY id ASC LIMIT ?',
            [beforeMoment.unix(), 5, limit],
            function (err, rows) {
                if (err) {
                    return callback(err);
                }

                var pendingMails;
                try {
                    pendingMails = _.map(rows, function (row) {
                        return deepExtend(
                            {},
                            row,
                            {
                                data: JSON.parse(row.data)
                            }
                        );
                    });
                }
                catch (error) {
                    return callback(error);
                }

                callback(null, pendingMails);
            }
        );
    }

    function removePendingMailFromQueue(id, callback) {
        Database.run('DELETE FROM email_queue WHERE id = ?', [id], callback);
    }

    function incrementFailureCounterForPendingEmail(id, callback) {
        var now = moment();
        Database.run(
            'UPDATE email_queue SET failures = failures + 1, modified_at = ? WHERE id = ?',
            [now.unix(), id],
            callback
        );
    }

    function sendPendingMail(pendingMail, callback) {
        sendMail(pendingMail, function (err) {
            if (err) {
                // we only log the error and increment the failure counter as we want to continue with pending mails
                Logger.tag('mail', 'queue').error('Error sending pending mail[' + pendingMail.id + ']:', err);

                return incrementFailureCounterForPendingEmail(pendingMail.id, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null);
                });
            }

            removePendingMailFromQueue(pendingMail.id, callback);
        });
    }

    function doGetMail(id, callback) {
        Database.get('SELECT * FROM email_queue WHERE id = ?', [id], callback);
    }

    return {
        enqueue: function (sender, recipient, email, data, callback) {
            if (!_.isPlainObject(data)) {
                return callback(new Error('Unexpected data: ' + data));
            }
            Database.run(
                'INSERT INTO email_queue ' +
                '(failures, sender, recipient, email, data) ' +
                'VALUES (?, ?, ?, ?, ?)',
                [0, sender, recipient, email, JSON.stringify(data)],
                function (err, res) {
                    callback(err, res);
                }
            );
        },

        getMail: function (id, callback) {
            doGetMail(id, callback);
        },

        getPendingMails: function (restParams, callback) {
            Database.get(
                'SELECT count(*) AS total FROM email_queue',
                [],
                function (err, row) {
                    if (err) {
                        return callback(err);
                    }

                    var total = row.total;

                    var filter = Resources.filterClause(
                        restParams,
                        'id',
                        ['id', 'failures', 'sender', 'recipient', 'email', 'created_at', 'modified_at'],
                        ['id', 'failures', 'sender', 'recipient', 'email']
                    );

                    Database.all(
                        'SELECT * FROM email_queue WHERE ' + filter.query,
                        _.concat([], filter.params),
                        function (err, rows) {
                            if (err) {
                                return callback(err);
                            }

                            callback(null, rows, total);
                        }
                    );
                }
            );
        },

        deleteMail: function (id, callback) {
            removePendingMailFromQueue(id, callback);
        },

        resetFailures: function (id, callback) {
            Database.run(
                'UPDATE email_queue SET failures = 0, modified_at = ? WHERE id = ?',
                [moment().unix(), id],
                function (err) {
                    if (err) {
                        return callback(err);
                    }

                    if (!this.changes) {
                        return callback('Error: could not reset failure count for mail: ' + id);
                    }

                    doGetMail(id, callback);
                }
            );
        },

        sendPendingMails: function (callback) {
            Logger.tag('mail', 'queue').info('Start sending pending mails...');

            var startTime = moment();

            var sendNextBatch = function (err) {
                if (err) {
                    return callback(err);
                }

                Logger.tag('mail', 'queue').info('Sending next batch...');

                findPendingMailsBefore(startTime, MAIL_QUEUE_DB_BATCH_SIZE, function (err, pendingMails) {
                    if (err) {
                        return callback(err);
                    }

                    if (_.isEmpty(pendingMails)) {
                        Logger.tag('mail', 'queue').info('Done sending pending mails.');
                        return callback(null);
                    }

                    async.eachLimit(
                        pendingMails,
                        MAIL_QUEUE_MAX_PARALLEL_SENDING,
                        sendPendingMail,
                        sendNextBatch
                    );
                });
            };

            sendNextBatch(null);
        }
    };
});
