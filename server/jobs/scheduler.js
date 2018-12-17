'use strict';

const _ = require('lodash');
const cron = require('node-cron');
const glob = require('glob');
const moment = require('moment');

const config = require('../config').config
const Logger = require('../logger')

const jobFiles = glob.sync(__dirname + '/*Job.js');
_.each(jobFiles, function (jobFile) {
    require(jobFile);
});

const tasks = {};

let taskId = 1;
function nextTaskId() {
    const id = taskId;
    taskId += 1;
    return id;
}

function schedule(expr, jobName) {
    Logger.tag('jobs').info('Scheduling job: %s  %s', expr, jobName);

    var job = require(`../jobs/${jobName}`);

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
        lastRunDuration: null,
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
            var now = moment();
            var duration = now.diff(task.runningSince);
            Logger.tag('jobs').profile('[%sms]\t%s', duration, task.name);

            task.runningSince = false;
            task.lastRunDuration = duration;
            task.state = 'idle';
        });
    };

    cron.schedule(expr, task.run);

    tasks['' + id] = task;
}

module.exports = {
    init: function () {
        Logger.tag('jobs').info('Scheduling background jobs...');

        try {
            schedule('0 */1 * * * *', 'MailQueueJob');
            schedule('15 */1 * * * *', 'FixNodeFilenamesJob');

            if (config.client.monitoring.enabled) {
                schedule('30 */15 * * * *', 'NodeInformationRetrievalJob');
                schedule('45 */5 * * * *', 'MonitoringMailsSendingJob');
                schedule('0 0 3 * * *', 'OfflineNodesDeletionJob'); // every night at 3:00
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
}
