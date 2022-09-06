/**
 * Contains type guards for objects.
 */

/**
 * Type guard checking the given value is a non-null `object`.
 *
 * Warning: This is also true for e.g. arrays, so don't rely to heavily on this.
 *
 * @param arg - Value to check.
 */
export function isObject(arg: unknown): arg is object {
    return arg !== null && typeof arg === "object";
}

/**
 * Type guard checking the given value is a plain object (not an `array`).
 *
 * @param arg - Value to check.
 */
export function isPlainObject(arg: unknown): arg is { [key: string]: unknown } {
    return isObject(arg) && !Array.isArray(arg);
}

/**
 * Type guard checking if the given value is an object having the property specified by `key`.
 *
 * @param arg - Value to check.
 * @param key - Key to index the property on the object.
 */
export function hasOwnProperty<Key extends PropertyKey>(
    arg: unknown,
    key: Key
): arg is Record<Key, unknown> {
    return isObject(arg) && key in arg;
}
