'use strict';

angular.module('ffffng').factory('VersionResource', function (
    version,
    Resources
) {
    return {
        get: function (req, res) {
            return Resources.success(
                res,
                {
                    version: version
                }
            );
        }
    };
});
