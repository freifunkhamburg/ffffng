'use strict';

angular.module('ffffng')
.factory('config', function () {
    return <%= JSON.stringify(config) %>;
});
