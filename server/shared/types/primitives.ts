/**
 * Contains type guards for primitive types and values.
 */

// =====================================================================================================================
// Numbers
// =====================================================================================================================

/**
 * Type guard for numbers.
 *
 * @param arg - Value to check.
 */
export function isNumber(arg: unknown): arg is number {
    return typeof arg === "number";
}

/**
 * Type guard checking the given value is an integer `number`.
 *
 * @param arg - Value to check.
 */
export function isInteger(arg: unknown): arg is number {
    return isNumber(arg) && Number.isInteger(arg);
}

/**
 * Type guard checking the given value is a floating point `number`.
 *
 * @param arg - Value to check.
 */
export function isFloat(arg: unknown): arg is number {
    return isNumber(arg) && Number.isFinite(arg);
}

// =====================================================================================================================
// Strings
// =====================================================================================================================

/**
 * Type guard for strings.
 *
 * @param arg - Value to check.
 */
export function isString(arg: unknown): arg is string {
    return typeof arg === "string";
}

// =====================================================================================================================
// Booleans
// =====================================================================================================================

/**
 * Type guard for booleans.
 *
 * @param arg - Value to check.
 */
export function isBoolean(arg: unknown): arg is boolean {
    return typeof arg === "boolean";
}

// =====================================================================================================================
// Primitive values
// =====================================================================================================================

/**
 * Type guard for null values.
 *
 * @param arg - Value to check.
 */
export function isNull(arg: unknown): arg is null {
    return arg === null;
}

/**
 * Type guard for undefined values.
 *
 * @param arg - Value to check.
 */
export function isUndefined(arg: unknown): arg is undefined {
    return typeof arg === "undefined";
}
