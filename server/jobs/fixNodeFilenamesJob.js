'use strict';

angular.module('ffffng').factory('FixNodeFilenamesJob', function (NodeService, Logger) {
    return {
        description: 'Makes sure node files (holding fastd key, name, etc.) are correctly named.',

        run: function (callback) {
            NodeService.fixNodeFilenames(function (err) {
                if (err) {
                    Logger.tag('nodes', 'fix-filenames').error('Error fixing filenames:', err);
                }

                callback();
            });
        }
    };
});
