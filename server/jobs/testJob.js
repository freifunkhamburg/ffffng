'use strict';

angular.module('ffffng').factory('TestJob', function (Logger) {
    var i = 1;

    return {
        run: function (callback) {
            var j = i;
            i += 1;

            Logger.tag('test').info('Start test job... ' + j);
            setTimeout(function () {
                Logger.tag('test').info('Done test job... ' + j);
                callback();
            }, 2000);
        }
    };
});
