/**
 * Utility functions for numbers.
 */
import { isFloat, isInteger } from "../types";

// TODO: Write tests!

/**
 * Normalizes the given `string` before parsing as a `number` by:
 *
 * * Removing whitespace from beginning and end of the `string`.
 * * Removing one `+` at the beginning of the number.
 *
 * @param arg - String to normalize.
 * @returns The normalized string.
 */
function normalizeStringToParse(arg: string): string {
    const str = (arg as string).trim();
    return str.startsWith("+") ? str.slice(1) : str;
}

/**
 * Parses the given value and converts it into an integer.
 *
 * For a `string` to be considered a valid representation of an integer `number` it has to satisfy the
 * following criteria:
 *
 * * The integer must be base 10.
 * * The `string` starts with an optional `+` or `-` sign followed by one or more digits.
 * * The first digit must not be `0`.
 * * Surrounding whitespaces will be ignored.
 *
 * @param arg - Value to parse.
 * @returns The parsed integer `number`.
 * @throws {@link SyntaxError} - If the given value does not represent a valid integer.
 * @throws {@link RangeError} - If the given value is a non-integer number.
 * @throws {@link TypeError} - If the given value is neither an integer `number` nor a `string`.
 */
export function parseToInteger(arg: unknown): number;

/**
 * Parses the given value and converts it into an integer.
 *
 * For a `string` to be considered a valid representation of an integer `number` it has to satisfy the
 * following criteria:
 *
 * * The integer base matches the given radix.
 * * The `string` starts with an optional `+` or `-` sign followed by one or more digits.
 * * The first digit must not be `0`.
 * * Surrounding whitespaces will be ignored.
 *
 * @param arg - Value to parse.
 * @param radix - Integer base to parse against. Must be an integer in range `2 <= radix <= 36`.
 * @returns The parsed integer `number`.
 * @throws {@link SyntaxError} - If the given value does not represent a valid integer.
 * @throws {@link RangeError} - If the given value is a non-integer number or the given radix is out of range.
 * @throws {@link TypeError} - If the given value is neither an integer `number` nor a `string`.
 */
export function parseToInteger(arg: unknown, radix: number): number;

/**
 * Parses the given value and converts it into an integer.
 *
 * For a `string` to be considered a valid representation of an integer `number` it has to satisfy the
 * following criteria:
 *
 * * The integer base matches the given or default radix.
 * * The `string` starts with an optional `+` or `-` sign followed by one or more digits.
 * * The first digit must not be `0`.
 * * Surrounding whitespaces will be ignored.
 *
 * @param arg - Value to parse.
 * @param radix - Optional: Integer base to parse against. Must be an integer in range `2 <= radix <= 36`.
 * @returns The parsed integer `number`.
 * @throws {@link SyntaxError} - If the given value does not represent a valid integer.
 * @throws {@link RangeError} - If the given value is a non-integer number or the given radix is out of range.
 * @throws {@link TypeError} - If the given value is neither an integer `number` nor a `string`.
 */
export function parseToInteger(arg: unknown, radix?: number): number {
    if (!radix) {
        radix = 10;
    }
    if (radix < 2 || radix > 36 || isNaN(radix)) {
        throw new RangeError(`Radix out of range: ${radix}`);
    }

    if (isInteger(arg)) {
        return arg;
    }

    switch (typeof arg) {
        case "number":
            throw new RangeError(`Not an integer: ${arg}`);
        case "string": {
            const str = normalizeStringToParse(arg as string);
            const num = parseInt(str, radix);
            if (isNaN(num)) {
                throw new SyntaxError(
                    `Not a valid number (radix: ${radix}): ${str}`
                );
            }
            if (num.toString(radix).toLowerCase() !== str.toLowerCase()) {
                throw new SyntaxError(
                    `Parsed integer does not match given string (radix: ${radix}): ${str}`
                );
            }
            return num;
        }
        default:
            throw new TypeError(
                `Cannot parse number (radix: ${radix}): ${arg} of type ${typeof arg}`
            );
    }
}

/**
 * Parses the given value and converts it into a finite floating point `number`.
 *
 * For a `string` to be considered a valid representation of a floating point `number` it has to satisfy the
 * following criteria:
 *
 * * The number is base 10.
 * * The `string` starts with an optional `+` or `-` sign followed by one or more digits and at most one decimal point.
 * * It starts with at most one leading `0` (after the optional sign).
 * * Surrounding whitespaces will be ignored.
 *
 * @param arg - Value to parse.
 * @returns The parsed floating point `number`.
 * @throws {@link SyntaxError} - If the given value does not represent a finite floating point number.
 * @throws {@link RangeError} - If the given value is number that is either not finite or is `NaN`.
 * @throws {@link TypeError} - If the given value is neither a floating point `number` nor a `string`.
 */
export function parseToFloat(arg: unknown): number {
    if (isFloat(arg)) {
        return arg;
    }
    switch (typeof arg) {
        case "number":
            throw new Error(`Not a finite number: ${arg}`);
        case "string": {
            let str = (arg as string).trim();
            const num = parseFloat(str);
            if (isNaN(num)) {
                throw new Error(`Not a valid number: ${str}`);
            }

            if (Number.isInteger(num)) {
                str = str.replace(/\.0+$/, "");
            }

            if (num.toString(10) !== str) {
                throw new Error(
                    `Parsed float does not match given string: ${num.toString(
                        10
                    )} !== ${str}`
                );
            }
            return num;
        }
        default:
            throw new Error(`Cannot parse number: ${arg}`);
    }
}
