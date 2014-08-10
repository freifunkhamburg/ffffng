'use strict';

(function () {
    var module = angular.module('ffffng');

    function lib(name, windowField) {
        if (!windowField) {
            windowField = name;
        }

        module.factory(name, function () {
            return window[windowField];
        });
    }

    lib('_');
    lib('geolib');
})();
