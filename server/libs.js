'use strict';

(function () {
    var module = angular.module('ffffng');

    function lib(name, nodeModule) {
        if (!nodeModule) {
            nodeModule = name;
        }

        module.factory(name, function () {
            return require(nodeModule);
        });
    }

    lib('_', 'lodash');
    lib('async');
    lib('crypto');
    lib('deepExtend', 'deep-extend');
    lib('fs');
    lib('glob');
    lib('moment');
    lib('request');
})();
