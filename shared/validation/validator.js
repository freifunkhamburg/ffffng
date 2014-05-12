'use strict';

angular.module('ffffng').factory('Validator', function (_) {
    var isValid = function (constraint, acceptUndefined, value) {
        if (value === undefined) {
            return acceptUndefined || constraint.optional;
        }

        var trimmed = value.trim();
        return (trimmed === '' && constraint.optional) || trimmed.match(constraint.regex);
    };

    var areValid = function (constraints, acceptUndefined, values) {
        var fields = Object.keys(constraints);
        for (var i = 0; i < fields.length; i ++) {
            var field = fields[i];
            if (!isValid(constraints[field], acceptUndefined, values[field])) {
                return false;
            }
        }
        return true;
    };

    return {
        forConstraint: function (constraint, acceptUndefined) {
            return _.partial(isValid, constraint, acceptUndefined);
        },
        forConstraints: function (constraints, acceptUndefined) {
            return _.partial(areValid, constraints, acceptUndefined);
        }
    };
});
