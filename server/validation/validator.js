'use strict';

const _ = require('lodash')

const Strings = require('../utils/strings')
const Logger = require('../logger')

// TODO: sanitize input for further processing as specified by constraints (correct types, trimming, etc.)

function isValidBoolean(value) {
    return _.isBoolean(value) || value === 'true' || value === 'false';
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

function isValidEnum(constraint, value) {
    if (!_.isString(value)) {
        return false;
    }

    return _.indexOf(constraint.allowed, value) >= 0;
}

function isValidString(constraint, value) {
    if (!_.isString(value)) {
        return false;
    }

    const trimmed = value.trim();
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

        case 'enum':
            return isValidEnum(constraint, value);

        case 'string':
            return isValidString(constraint, value);
    }

    Logger.tag('validation').error('No validation method for constraint type: {}', constraint.type);
    return false;
}

function areValid(constraints, acceptUndefined, values) {
    const fields = Object.keys(constraints);
    for (let i = 0; i < fields.length; i ++) {
        const field = fields[i];
        if (!isValid(constraints[field], acceptUndefined, values[field])) {
            return false;
        }
    }
    return true;
}

module.exports = {
    forConstraint (constraint, acceptUndefined) {
        return _.partial(isValid, constraint, acceptUndefined);
    },
    forConstraints (constraints, acceptUndefined) {
        return _.partial(areValid, constraints, acceptUndefined);
    }
}
