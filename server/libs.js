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

    lib('_', 'underscore');
    lib('crypto');
    lib('fs');
    lib('glob');
})();
