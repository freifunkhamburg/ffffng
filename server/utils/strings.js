'use strict';

angular.module('ffffng').factory('Strings', function (_) {
    return {
        normalizeString: function (str) {
            return _.isString(str) ? str.trim().replace(/\s+/g, ' ') : str;
        },

        normalizeMac: function (mac) {
            // parts only contains values at odd indexes
            var parts = mac.toUpperCase().replace(/:/g, '').split(/([A-F0-9]{2})/);

            var macParts = [];

            for (var i = 1; i < parts.length; i += 2) {
                macParts.push(parts[i]);
            }

            return macParts.join(':');
        },

        parseInt: function (str) {
            var parsed = _.parseInt(str, 10);
            return parsed.toString() === str ? parsed : undefined;
        }
    };
});
