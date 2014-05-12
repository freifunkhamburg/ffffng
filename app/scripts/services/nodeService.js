'use strict';

angular.module('ffffng')
.service('NodeService', function ($http) {
    return {
        'createNode': function (node) {
            return $http.post('/api/node', node);
        },

        'updateNode': function (node, token) {
            return $http.put('/api/node/' + token, node);
        },

        'getNode': function (token) {
            return $http.get('/api/node/' + token);
        }
    };
});
