'use strict';

angular.module('ffffng').factory('Router', function (app, NodeResource, MonitoringResource) {
    return {
        init: function () {
            app.post('/api/node', NodeResource.create);
            app.put('/api/node/:token', NodeResource.update);
            app.delete('/api/node/:token', NodeResource.delete);
            app.get('/api/node/:token', NodeResource.get);

            app.put('/api/monitoring/confirm/:mac', MonitoringResource.confirm);
        }
    };
});
