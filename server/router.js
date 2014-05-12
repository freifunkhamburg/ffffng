'use strict';

angular.module('ffffng').factory('Router', function (app, NodeResource) {
    return {
        init: function () {
            app.post('/api/node', NodeResource.create);
            app.put('/api/node/:token', NodeResource.update);
            app.get('/api/node/:token', NodeResource.get);
        }
    };
});
