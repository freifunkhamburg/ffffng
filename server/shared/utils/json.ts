/**
 * Utility functions for JSON.
 */
import { isJSONValue, type JSONObject, type JSONValue } from "../types";

/**
 * Parses the given `string` and converts it into a {@link JSONValue}.
 *
 * For the string to be considered valid JSON it has to satisfy the requirements for {@link JSON.parse}.
 *
 * @param str - `string` to parse.
 * @returns The parsed integer JSON value.
 * @throws {@link SyntaxError} - If the given `string` does not represent a valid JSON value.
 */
export function parseJSON(str: string): JSONValue {
    const json = JSON.parse(str);
    if (!isJSONValue(json)) {
        throw new Error("Invalid JSON returned. Should never happen.");
    }
    return json;
}

/**
 * Removes `undefined` fields from the given JSON'ish object to make it a valid {@link JSONObject}.
 *
 * Note: This only happens for fields directly belonging to the given object. No recursive cleanup is performed.
 *
 * @param obj - Object to remove `undefined` fields from.
 * @returns Cleaned up JSON object.
 */
export function filterUndefinedFromJSON(obj: {
    [key: string]: JSONValue | undefined;
}): JSONObject {
    const result: JSONObject = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }

    return result;
}
