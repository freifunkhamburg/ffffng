'use strict';

const _ = require('lodash')

const Constraints = require('../validation/constraints')
const ErrorTypes = require('../utils/errorTypes')
const Resources = require('../utils/resources')
const Scheduler = require('../jobs/scheduler')
const Strings = require('../utils/strings')
const Validator = require('../validation/validator')

const isValidId = Validator.forConstraint(Constraints.id);

function toExternalTask(task) {
    return {
        id: task.id,
        name: task.name,
        description: task.description,
        schedule: task.schedule,
        runningSince: task.runningSince && task.runningSince.unix(),
        lastRunStarted: task.lastRunStarted && task.lastRunStarted.unix(),
        lastRunDuration: task.lastRunDuration || undefined,
        state: task.state,
        enabled: task.enabled
    };
}

function withValidTaskId(req, res, callback) {
    const id = Strings.normalizeString(Resources.getData(req).id);

    if (!isValidId(id)) {
        return callback({data: 'Invalid task id.', type: ErrorTypes.badRequest});
    }

    callback(null, id);
}

function getTask(id, callback) {
    const tasks = Scheduler.getTasks();
    const task = tasks[id];

    if (!task) {
        return callback({data: 'Task not found.', type: ErrorTypes.notFound});
    }

    callback(null, task);
}

function withTask(req, res, callback) {
    withValidTaskId(req, res, function (err, id) {
        if (err) {
            return callback(err);
        }

        getTask(id, function (err, task) {
            if (err) {
                return callback(err);
            }

            callback(null, task);
        });
    });
}

function setTaskEnabled(req, res, enable) {
    withTask(req, res, function (err, task) {
        if (err) {
            return Resources.error(res, err);
        }

        task.enabled = !!enable; // ensure boolean

        return Resources.success(res, toExternalTask(task));
    });
}

module.exports = {
    getAll (req, res) {
        Resources.getValidRestParams('list', null, req, function (err, restParams) {
            if (err) {
                return Resources.error(res, err);
            }

            const tasks = Resources.sort(
                _.values(Scheduler.getTasks()),
                ['id', 'name', 'schedule', 'state', 'runningSince', 'lastRunStarted'],
                restParams
            );
            const filteredTasks = Resources.filter(
                tasks,
                ['id', 'name', 'schedule', 'state'],
                restParams
            );
            const total = filteredTasks.length;

            const pageTasks = Resources.getPageEntities(filteredTasks, restParams);

            res.set('X-Total-Count', total);
            return Resources.success(res, _.map(pageTasks, toExternalTask));
        });
    },

    run (req, res) {
        withTask(req, res, function (err, task) {
            if (err) {
                return Resources.error(res, err);
            }

            if (task.runningSince) {
                return Resources.error(res, {data: 'Task already running.', type: ErrorTypes.conflict});
            }

            task.run();

            return Resources.success(res, toExternalTask(task));
        });
    },

    enable (req, res) {
        setTaskEnabled(req, res, true);
    },

    disable (req, res) {
        setTaskEnabled(req, res, false);
    }
}
