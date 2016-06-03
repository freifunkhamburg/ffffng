'use strict';

angular.module('ffffng').factory('TaskResource', function (
    _,
    Resources,
    Scheduler
) {
    return {
        getAll: function (req, res) {
            var tasks = Scheduler.getTasks();
            return Resources.success(res, _.map(tasks, function (task) {
                return {
                    name: task.name,
                    schedule: task.schedule,
                    runningSince: task.runningSince && task.runningSince.unix(),
                    lastRunStarted: task.lastRunStarted && task.lastRunStarted.unix()
                };
            }));
        }
    };
});
