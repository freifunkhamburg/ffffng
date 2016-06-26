'use strict';

angular.module('ffffng').factory('DatabaseUtil', function (_) {
    return {
        inCondition: function (field, list) {
            return {
                query: '(' + field + ' IN (' + _.join(_.times(list.length, _.constant('?')), ', ') + '))',
                params: list
            };
        }
    };
});
