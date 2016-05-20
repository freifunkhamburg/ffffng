'use strict';

angular.module('ffffng')
.service('MailService', function (Database, _) {
    return {
        enqueue: function (sender, recipient, email, data, callback) {
            if (!_.isPlainObject(data)) {
                return callback(new Error('Unexpected data: ' + data));
            }
            Database.run(
                'INSERT INTO email_queue (failures, sender, recipient, email, data) VALUES (?, ?, ?, ?, ?)',
                [0, sender, recipient, email, JSON.stringify(data)],
                function (err, res) {
                    debugger;
                    callback(err, res);
                }
            );
        }
    };
});
