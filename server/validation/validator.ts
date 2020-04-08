import _ from "lodash";

import {parseInteger} from "../utils/strings";
import Logger from "../logger";

export interface Constraint {
    type: string,

    default?: any,

    optional?: boolean,

    allowed?: string[],

    min?: number,
    max?: number,

    regex?: RegExp,
}

export type Constraints = {[key: string]: Constraint};
export type Values = {[key: string]: any};

function isStringArray(arr: any): arr is string[] {
    return _.isArray(arr) && _.every(arr, (val: any) => _.isString(val));
}

export function isConstraint(val: any): val is Constraint {
    if (!_.isObject(val)) {
        return false;
    }

    const constraint = val as {[key: string]: any};

    if (!("type" in constraint) || !_.isString(constraint.type)) {
        return false;
    }

    if ("optional" in constraint
        && !_.isUndefined(constraint.optional)
        && !_.isBoolean(constraint.optional)) {
        return false;
    }

    if ("allowed" in constraint
        && !_.isUndefined(constraint.allowed)
        && !isStringArray(constraint.allowed)) {
        return false;
    }

    if ("min" in constraint
        && !_.isUndefined(constraint.min)
        && !_.isNumber(constraint.min)) {
        return false;
    }

    if ("max" in constraint
        && !_.isUndefined(constraint.max)
        && !_.isNumber(constraint.max)) {
        return false;
    }

    // noinspection RedundantIfStatementJS
    if ("regex" in constraint
        && !_.isUndefined(constraint.regex)
        && !_.isRegExp(constraint.regex)) {
        return false;
    }

    return true;
}

export function isConstraints(constraints: any): constraints is Constraints {
    if (!_.isObject(constraints)) {
        return false;
    }

    return _.every(
        constraints,
        (constraint: any, key: any) => _.isString(key) && isConstraint(constraint)
    );
}

// TODO: sanitize input for further processing as specified by constraints (correct types, trimming, etc.)

function isValidBoolean(value: any): boolean {
    return _.isBoolean(value) || value === 'true' || value === 'false';
}

function isValidNumber(constraint: Constraint, value: any): boolean {
    if (_.isString(value)) {
        value = parseInteger(value);
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

    // noinspection RedundantIfStatementJS
    if (_.isNumber(constraint.max) && value > constraint.max) {
        return false;
    }

    return true;
}

function isValidEnum(constraint: Constraint, value: any): boolean {
    if (!_.isString(value)) {
        return false;
    }

    return _.indexOf(constraint.allowed, value) >= 0;
}

function isValidString(constraint: Constraint, value: any): boolean {
    if (!constraint.regex) {
        throw new Error("String constraints must have regex set: " + constraint);
    }

    if (!_.isString(value)) {
        return false;
    }

    const trimmed = value.trim();
    return (trimmed === '' && constraint.optional) || constraint.regex.test(trimmed);
}

function isValid(constraint: Constraint, acceptUndefined: boolean, value: any): boolean {
    if (value === undefined) {
        return acceptUndefined || constraint.optional === true;
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

function areValid(constraints: Constraints, acceptUndefined: boolean, values: Values): boolean {
    const fields = new Set(Object.keys(constraints));
    for (const field of fields) {
        if (!isValid(constraints[field], acceptUndefined, values[field])) {
            return false;
        }
    }

    for (const field of Object.keys(values)) {
        if (!fields.has(field)) {
            Logger.tag('validation').error('Validation failed: No constraint for field: {}', field);
            return false;
        }
    }

    return true;
}

export function forConstraint (constraint: Constraint, acceptUndefined: boolean): (value: any) => boolean {
    return ((value: any): boolean => isValid(constraint, acceptUndefined, value));
}

export function forConstraints (constraints: Constraints, acceptUndefined: boolean): (values: Values) => boolean {
    return ((values: Values): boolean => areValid(constraints, acceptUndefined, values));
}
