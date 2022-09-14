/**
 * Helper functions for objects.
 */
import { hasOwnProperty } from "../types";

/**
 * If the given value is an object this function returns the property specified by `key` if it exists.
 *
 * @param arg - Value to treat as an object to look up the property.
 * @param key - Key indexing the property.
 * @returns The property of the given object indexed by `key` or `undefined` if `arg` is not an object
 *          or has no property `key`.
 */
export function getFieldIfExists(
    arg: unknown,
    key: PropertyKey
): unknown | undefined {
    return hasOwnProperty(arg, key) ? arg[key] : undefined;
}
