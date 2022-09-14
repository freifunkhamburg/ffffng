/**
 * Contains types and type guard for representing JSON values.
 */
import { isBoolean, isNull, isNumber, isString } from "./primitives";
import { toIsArray } from "./arrays";
import { isPlainObject } from "./objects";

/**
 * Shorthand type alias representing a JSON value.
 */
export type JSONValue =
    | null
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

/**
 * Type guard checking the given value is a valid {@link JSONValue}.
 *
 * @param arg - Value to check.
 */
export function isJSONValue(arg: unknown): arg is JSONValue {
    return (
        isNull(arg) ||
        isString(arg) ||
        isNumber(arg) ||
        isBoolean(arg) ||
        isJSONObject(arg) ||
        isJSONArray(arg)
    );
}

/**
 * Type representing a JSON object of `string` keys and values of type {@link JSONValue}.
 */
export interface JSONObject {
    [x: string]: JSONValue;
}

/**
 * Type guard checking the given value is a valid {@link JSONObject}.
 *
 * @param arg - Value to check.
 */
export function isJSONObject(arg: unknown): arg is JSONObject {
    if (!isPlainObject(arg)) {
        return false;
    }

    const obj = arg as object;
    for (const [key, value] of Object.entries(obj)) {
        if (!isString(key) || !isJSONValue(value)) {
            return false;
        }
    }

    return true;
}

/**
 * Shorthand type alias representing a JSON array with elements of type {@link JSONValue}.
 */
export type JSONArray = Array<JSONValue>;

/**
 * Type guard checking the given value is a valid {@link JSONArray}.
 *
 * @param arg - Value to check.
 */
export const isJSONArray = toIsArray(isJSONValue);
