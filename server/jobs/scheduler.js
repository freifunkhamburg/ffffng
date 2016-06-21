'use strict';

var glob = require('glob');
var _ = require('lodash');

var jobFiles = glob.sync(__dirname + '/*Job.js');
_.each(jobFiles, function (jobFile) {
    require(jobFile);
});

angular.module('ffffng').factory('Scheduler', function ($injector, Logger, config, moment) {
    var cron = require('node-cron');

    var tasks = {};

    var taskId = 1;
    function nextTaskId() {
        var id = taskId;
        taskId += 1;
        return id;
    }

    function schedule(expr, jobName) {
        Logger.tag('jobs').info('Scheduling job: %s  %s', expr, jobName);

        var job = $injector.get(jobName);

        if (!_.isFunction(job.run)) {
            throw new Error('The job ' + jobName + ' does not provide a "run" function.');
        }

        var id = nextTaskId();
        var task = {
            id: id,
            name: jobName,
            description: job.description,
            schedule: expr,
            job: job,
            runningSince: false,
            lastRunStarted: false,
            state: 'idle',
            enabled: true
        };

        task.run = function () {
            if (task.runningSince || !task.enabled) {
                // job is still running, skip execution
                return;
            }

            task.runningSince = moment();
            task.lastRunStarted = task.runningSince;
            task.state = 'running';

            job.run(function () {
                task.runningSince = false;
                task.state = 'idle';
            });
        };

        cron.schedule(expr, task.run);

        tasks['' + id] = task;
    }

    return {
        init: function () {
            Logger.tag('jobs').info('Scheduling background jobs...');

            try {
                schedule('0 */1 * * * *', 'MailQueueJob');

                if (config.client.monitoring.enabled) {
                    schedule('30 */15 * * * *', 'NodeInformationRetrievalJob');
                    schedule('45 */5 * * * *', 'MonitoringMailsSendingJob');
                    schedule('0 0 3 * * *', 'NodeInformationCleanupJob'); // every night at 3:00
                }
            }
            catch (error) {
                Logger.tag('jobs').error('Error during scheduling of background jobs:', error);
                throw error;
            }

            Logger.tag('jobs').info('Scheduling of background jobs done.');
        },

        getTasks: function () {
            return tasks;
        }
    };
});
