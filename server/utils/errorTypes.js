'use strict';

angular.module('ffffng').factory('ErrorTypes', function () {
    return {
        badRequest: {code: 400},
        notFound: {code: 404},
        conflict: {code: 409},
        internalError: {code: 500}
    };
});
