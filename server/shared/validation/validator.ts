import { parseInteger } from "../utils/strings";
import {
    isBoolean,
    isNumber,
    isObject,
    isOptional,
    isRegExp,
    isString,
    toIsArray,
} from "../types";

export interface Constraint {
    type: string;

    default?: unknown;

    optional?: boolean;

    allowed?: string[];

    min?: number;
    max?: number;

    regex?: RegExp;
}

export type Constraints = { [key: string]: Constraint };
export type Values = { [key: string]: unknown };

export function isConstraint(arg: unknown): arg is Constraint {
    if (!isObject(arg)) {
        return false;
    }

    const constraint = arg as Constraint;
    return (
        isString(constraint.type) &&
        // default?: any
        isOptional(constraint.optional, isBoolean) &&
        isOptional(constraint.allowed, toIsArray(isString)) &&
        isOptional(constraint.min, isNumber) &&
        isOptional(constraint.max, isNumber) &&
        isOptional(constraint.regex, isRegExp)
    );
}

export function isConstraints(
    constraints: unknown
): constraints is Constraints {
    if (!isObject(constraints)) {
        return false;
    }

    return Object.entries(constraints).every(
        ([key, constraint]) => isString(key) && isConstraint(constraint)
    );
}

// TODO: sanitize input for further processing as specified by constraints (correct types, trimming, etc.)

function isValidBoolean(value: unknown): boolean {
    return isBoolean(value) || value === "true" || value === "false";
}

function isValidNumber(constraint: Constraint, value: unknown): boolean {
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

function isValidEnum(constraint: Constraint, value: unknown): boolean {
    if (!isString(value)) {
        return false;
    }

    const allowed = constraint.allowed || [];
    return allowed.indexOf(value) >= 0;
}

function isValidString(constraint: Constraint, value: unknown): boolean {
    if (!constraint.regex) {
        throw new Error(
            "String constraints must have regex set: " + constraint
        );
    }

    if (!isString(value)) {
        return false;
    }

    const trimmed = value.trim();
    return (
        (trimmed === "" && constraint.optional) ||
        constraint.regex.test(trimmed)
    );
}

function isValid(
    constraint: Constraint,
    acceptUndefined: boolean,
    value: unknown
): boolean {
    if (value === undefined) {
        return acceptUndefined || constraint.optional === true;
    }

    switch (constraint.type) {
        case "boolean":
            return isValidBoolean(value);

        case "number":
            return isValidNumber(constraint, value);

        case "enum":
            return isValidEnum(constraint, value);

        case "string":
            return isValidString(constraint, value);
    }

    return false;
}

function areValid(
    constraints: Constraints,
    acceptUndefined: boolean,
    values: Values
): boolean {
    const fields = new Set(Object.keys(constraints));
    for (const field of fields) {
        if (!isValid(constraints[field], acceptUndefined, values[field])) {
            return false;
        }
    }

    for (const field of Object.keys(values)) {
        if (!fields.has(field)) {
            return false;
        }
    }

    return true;
}

export function forConstraint(
    constraint: Constraint,
    acceptUndefined: boolean
): (value: unknown) => boolean {
    return (value: unknown): boolean =>
        isValid(constraint, acceptUndefined, value);
}

export function forConstraints(
    constraints: Constraints,
    acceptUndefined: boolean
): (values: Values) => boolean {
    return (values: Values): boolean =>
        areValid(constraints, acceptUndefined, values);
}
