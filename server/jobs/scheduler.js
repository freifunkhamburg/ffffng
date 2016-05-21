'use strict';

var glob = require('glob');
var _ = require('lodash');

var jobFiles = glob.sync(__dirname + '/*Job.js');
_.each(jobFiles, function (jobFile) {
    require(jobFile);
});

angular.module('ffffng').factory('Scheduler', function ($injector) {
    var cron = require('node-cron');

    function schedule(expr, jobName) {
        var job = $injector.get(jobName);

        if (!_.isFunction(job.run)) {
            throw new Error('The job ' + jobName + ' does not provide a "run" function.');
        }

        cron.schedule(expr, job.run);
    }

    return {
        init: function () {
            schedule('*/5 * * * * *', 'MailQueueJob');
        }
    };
});
