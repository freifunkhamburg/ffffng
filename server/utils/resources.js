'use strict';

angular.module('ffffng').factory('Resources', function (_) {
    function respond(res, httpCode, data) {
        res.writeHead(httpCode, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    }

    return {
        getData: function (req) {
            return _.extend({}, req.body, req.params, req.query);
        },

        success: function (res, data) {
            respond(res, 200, data);
        },

        error: function (res, err) {
            respond(res, err.type.code, err.data);
        }
    };
});
