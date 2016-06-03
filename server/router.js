'use strict';

angular.module('ffffng').factory('Router', function (
    app,
    NodeResource,
    MonitoringResource,
    TaskResource
) {
    return {
        init: function () {
            app.post('/api/node', NodeResource.create);
            app.put('/api/node/:token', NodeResource.update);
            app.delete('/api/node/:token', NodeResource.delete);
            app.get('/api/node/:token', NodeResource.get);

            app.put('/api/monitoring/confirm/:token', MonitoringResource.confirm);
            app.put('/api/monitoring/disable/:token', MonitoringResource.disable);

            app.get('/internal/api/task/all', TaskResource.getAll);
        }
    };
});
