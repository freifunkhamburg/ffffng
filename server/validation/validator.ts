import {parseInteger} from "../utils/strings";
import Logger from "../logger";
import {isArray, isBoolean, isNumber, isObject, isRegExp, isString, isUndefined} from "../types";

export interface Constraint {
    type: string,

    default?: any,

    optional?: boolean,

    allowed?: string[],

    min?: number,
    max?: number,

    regex?: RegExp,
}

export type Constraints = { [key: string]: Constraint };
export type Values = { [key: string]: any };

export function isConstraint(val: any): val is Constraint {
    if (!isObject(val)) {
        return false;
    }

    const constraint = val as { [key: string]: any };

    if (!("type" in constraint) || !isString(constraint.type)) {
        return false;
    }

    if ("optional" in constraint
        && !isUndefined(constraint.optional)
        && !isBoolean(constraint.optional)) {
        return false;
    }

    if ("allowed" in constraint
        && !isUndefined(constraint.allowed)
        && !isArray(constraint.allowed, isString)) {
        return false;
    }

    if ("min" in constraint
        && !isUndefined(constraint.min)
        && !isNumber(constraint.min)) {
        return false;
    }

    if ("max" in constraint
        && !isUndefined(constraint.max)
        && !isNumber(constraint.max)) {
        return false;
    }

    // noinspection RedundantIfStatementJS
    if ("regex" in constraint
        && !isUndefined(constraint.regex)
        && !isRegExp(constraint.regex)) {
        return false;
    }

    return true;
}

export function isConstraints(constraints: any): constraints is Constraints {
    if (!isObject(constraints)) {
        return false;
    }

    return Object.entries(constraints).every(([key, constraint]) => isString(key) && isConstraint(constraint));
}

// TODO: sanitize input for further processing as specified by constraints (correct types, trimming, etc.)

function isValidBoolean(value: any): boolean {
    return isBoolean(value) || value === 'true' || value === 'false';
}

function isValidNumber(constraint: Constraint, value: any): boolean {
    if (isString(value)) {
        value = parseInteger(value);
    }

    if (!isNumber(value)) {
        return false;
    }

    if (isNaN(value) || !isFinite(value)) {
        return false;
    }

    if (isNumber(constraint.min) && value < constraint.min) {
        return false;
    }

    // noinspection RedundantIfStatementJS
    if (isNumber(constraint.max) && value > constraint.max) {
        return false;
    }

    return true;
}

function isValidEnum(constraint: Constraint, value: any): boolean {
    if (!isString(value)) {
        return false;
    }

    const allowed = constraint.allowed || [];
    return allowed.indexOf(value) >= 0;
}

function isValidString(constraint: Constraint, value: any): boolean {
    if (!constraint.regex) {
        throw new Error("String constraints must have regex set: " + constraint);
    }

    if (!isString(value)) {
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

export function forConstraint(constraint: Constraint, acceptUndefined: boolean): (value: any) => boolean {
    return ((value: any): boolean => isValid(constraint, acceptUndefined, value));
}

export function forConstraints(constraints: Constraints, acceptUndefined: boolean): (values: Values) => boolean {
    return ((values: Values): boolean => areValid(constraints, acceptUndefined, values));
}
