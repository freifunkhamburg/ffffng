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

            app.get('/internal/api/tasks', TaskResource.getAll);
            app.put('/internal/api/tasks/run/:id', TaskResource.run);
            app.put('/internal/api/tasks/enable/:id', TaskResource.enable);
            app.put('/internal/api/tasks/disable/:id', TaskResource.disable);

            app.put('/internal/api/nodes/:token', NodeResource.update);
            app.delete('/internal/api/nodes/:token', NodeResource.delete);
            app.get('/internal/api/nodes', NodeResource.getAll);
            app.get('/internal/api/nodes/:token', NodeResource.get);
        }
    };
});
