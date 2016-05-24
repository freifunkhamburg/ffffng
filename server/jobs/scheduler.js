'use strict';

var glob = require('glob');
var _ = require('lodash');

var jobFiles = glob.sync(__dirname + '/*Job.js');
_.each(jobFiles, function (jobFile) {
    require(jobFile);
});

angular.module('ffffng').factory('Scheduler', function ($injector, Logger) {
    var cron = require('node-cron');

    function schedule(expr, jobName) {
        Logger.tag('jobs').info('Scheduling job: ' + expr + ' ' + jobName);

        var job = $injector.get(jobName);

        if (!_.isFunction(job.run)) {
            throw new Error('The job ' + jobName + ' does not provide a "run" function.');
        }

        cron.schedule(expr, job.run);
    }

    return {
        init: function () {
            Logger.tag('jobs').info('Scheduling background jobs...');

            try {
                schedule('0 */1 * * * *', 'MailQueueJob');
                // schedule('0 */5 * * * *', 'NodeInformationRetrievalJob');
                schedule('*/10 * * * * *', 'NodeInformationRetrievalJob');
                // schedule('0 */1 * * * *', 'NodeInformationCleanupJob');
            }
            catch (error) {
                Logger.tag('jobs').error('Error during scheduling of background jobs:', error);
                throw error;
            }

            Logger.tag('jobs').info('Scheduling of background jobs done.');
        }
    };
});
