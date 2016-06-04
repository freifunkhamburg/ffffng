'use strict';

angular.module('ffffng').factory('TaskResource', function (
    Constraints,
    Validator,
    _,
    Strings,
    Resources,
    ErrorTypes,
    Scheduler
) {
    var isValidId = Validator.forConstraint(Constraints.id);

    function toExternalTask(task) {
        return {
            name: task.name,
            schedule: task.schedule,
            runningSince: task.runningSince && task.runningSince.unix(),
            lastRunStarted: task.lastRunStarted && task.lastRunStarted.unix()
        };
    }

    return {
        getAll: function (req, res) {
            var tasks = Scheduler.getTasks();
            return Resources.success(res, _.mapValues(tasks, toExternalTask));
        },

        run: function (req, res) {
            var id = Strings.normalizeString(Resources.getData(req).id);

            if (!isValidId(id)) {
                return Resources.error(res, {data: 'Invalid task id.', type: ErrorTypes.badRequest});
            }

            var tasks = Scheduler.getTasks();
            var task = tasks[id];

            if (!task) {
                return Resources.error(res, {data: 'Task not found.', type: ErrorTypes.notFound});
            }

            if (task.runningSince) {
                return Resources.error(res, {data: 'Task already running.', type: ErrorTypes.conflict});
            }

            task.run();

            return Resources.success(res, toExternalTask(task));
        }
    };
});
