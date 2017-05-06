'use strict';

angular.module('ffffng')
.service('NodeService', function ($http, config) {
    var pathPrefix = config.rootPath === '/' ? '' : config.rootPath;

    return {
        'createNode': function (node) {
            return $http.post(pathPrefix + '/api/node', node);
        },

        'updateNode': function (node, token) {
            return $http.put(pathPrefix + '/api/node/' + token, node);
        },

        'deleteNode': function (token) {
            return $http.delete(pathPrefix + '/api/node/' + token);
        },

        'getNode': function (token) {
            return $http.get(pathPrefix + '/api/node/' + token);
        }
    };
});
