/**
 * Utility functions all around strings.
 */
import { isInteger, MAC } from "../types";

/**
 * Trims the given `string` and replaces multiple whitespaces by one space each.
 *
 * Can be used to make sure user input has a canonical form.
 *
 * @param str - `string` to normalize.
 * @returns The normalized `string`.
 */
export function normalizeString(str: string): string {
    return str.trim().replace(/\s+/g, " ");
}

/**
 * Normalizes a {@link MAC} address so that it has a canonical format:
 *
 * The `MAC` address will be converted so that it is all uppercase with colon as the delimiter, e.g.:
 * `12:34:56:78:9A:BC`.
 *
 * @param mac - `MAC` address to normalize.
 * @returns The normalized `MAC` address.
 */
export function normalizeMac(mac: MAC): MAC {
    // parts only contains values at odd indexes
    const parts = mac
        .toUpperCase()
        .replace(/[-:]/g, "")
        .split(/([A-F0-9]{2})/);

    const macParts = [];

    for (let i = 1; i < parts.length; i += 2) {
        macParts.push(parts[i]);
    }

    return macParts.join(":") as MAC;
}

/**
 * Parses the given `string` and converts it into an integer.
 *
 * For a `string` to be considered a valid representation of an integer `number` it has to satisfy the
 * following criteria:
 *
 * * The integer is base `10`.
 * * The `string` starts with an optional `+` or `-` sign followed by one or more digits.
 * * The first digit must not be `0`.
 * * The `string` does not contain any other characters.
 *
 * @param str - `string` to parse.
 * @returns The parsed integer `number`.
 * @throws {@link SyntaxError} - If the given `string` does not represent a valid integer.
 */
export function parseInteger(str: string): number {
    const parsed = parseInt(str, 10);
    const original = str.startsWith("+") ? str.slice(1) : str;

    if (isInteger(parsed) && parsed.toString() === original) {
        return parsed;
    } else {
        throw new SyntaxError(
            `String does not represent a valid integer: "${str}"`
        );
    }
}
