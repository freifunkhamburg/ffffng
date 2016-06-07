'use strict';

angular.module('ffffng').factory('Validator', function (_, Strings, Logger) {
    function isValidBoolean(value) {
        return _.isBoolean(value);
    }

    function isValidNumber(constraint, value) {
        if (_.isString(value)) {
            value = Strings.parseInt(value);
        }

        if (!_.isNumber(value)) {
            return false;
        }

        if (_.isNaN(value) || !_.isFinite(value)) {
            return false;
        }

        if (_.isNumber(constraint.min) && value < constraint.min) {
            return false;
        }

        if (_.isNumber(constraint.max) && value > constraint.max) {
            return false;
        }

        return true;
    }

    function isValidString(constraint, value) {
        if (!_.isString(value)) {
            return false;
        }

        var trimmed = value.trim();
        return (trimmed === '' && constraint.optional) || trimmed.match(constraint.regex);
    }

    function isValid(constraint, acceptUndefined, value) {
        if (value === undefined) {
            return acceptUndefined || constraint.optional;
        }

        switch (constraint.type) {
            case 'boolean':
                return isValidBoolean(value);

            case 'number':
                return isValidNumber(constraint, value);

            case 'string':
                return isValidString(constraint, value);
        }

        Logger.tag('validation').error('No validation method for constraint type: {}', constraint.type);
        return false;
    }

    function areValid(constraints, acceptUndefined, values) {
        var fields = Object.keys(constraints);
        for (var i = 0; i < fields.length; i ++) {
            var field = fields[i];
            if (!isValid(constraints[field], acceptUndefined, values[field])) {
                return false;
            }
        }
        return true;
    }

    return {
        forConstraint: function (constraint, acceptUndefined) {
            return _.partial(isValid, constraint, acceptUndefined);
        },
        forConstraints: function (constraints, acceptUndefined) {
            return _.partial(areValid, constraints, acceptUndefined);
        }
    };
});
