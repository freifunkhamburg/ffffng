/**
 * Contains type guards for arrays.
 *
 * @module arrays
 */
import type { TypeGuard } from "./helpers";

/**
 * Type guard for an array with elements of type `<Element>`.
 *
 * @param arg - Value to check
 * @param isElement - Type guard to check elements for type `<Element>`
 */
export function isArray<Element>(
    arg: unknown,
    isElement: TypeGuard<Element>
): arg is Array<Element> {
    if (!Array.isArray(arg)) {
        return false;
    }
    for (const element of arg) {
        if (!isElement(element)) {
            return false;
        }
    }
    return true;
}

/**
 * Helper function to construct array type guards.
 *
 * @param isElement - Type guard to check elements for type `<Element>`
 * @returns A type guard for arrays with elements of type `<Element>`.
 */
export function toIsArray<Element>(
    isElement: TypeGuard<Element>
): TypeGuard<Element[]> {
    return (arg): arg is Element[] => isArray(arg, isElement);
}
