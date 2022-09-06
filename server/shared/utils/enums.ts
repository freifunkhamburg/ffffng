/**
 * Utility functions for enums.
 */

/**
 * Helper function to detect unhandled enum fields in `switch` statements at compile time. In case this function
 * is called at runtime anyway (which should not happen) it throws a runtime error.
 *
 * In the example below the compiler will complain if not for all fields of `Enum` a corresponding `case` statement
 * exists.
 *
 * @param field - Unhandled field, the value being switched over.
 * @throws {@link Error} - If the function is called at runtime.
 *
 * @example
 * switch (enumValue) {
 *     case Enum.FIELD1:
 *         return;
 *     case Enum.FIELD2:
 *         return;
 *
 *     ...
 *
 *     default:
 *         return unhandledEnumField(enumValue);
 * }
 */
export function unhandledEnumField(field: never): never {
    throw new Error(`Unhandled enum field: ${field}`);
}
