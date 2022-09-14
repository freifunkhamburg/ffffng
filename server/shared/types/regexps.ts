/**
 * Contains type guards for regular expressions.
 */
import { isObject } from "./objects";

/**
 * Type guard for {@link RegExp}s.
 *
 * @param arg - Value to check.
 */
export function isRegExp(arg: unknown): arg is RegExp {
    return isObject(arg) && arg instanceof RegExp;
}
