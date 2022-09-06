/**
 * Contains type guards for regular expressions.
 */

/**
 * Type guard for {@link Map}s.
 *
 * @param arg - Value to check.
 */
export function isMap(arg: unknown): arg is Map<unknown, unknown> {
    return arg instanceof Map;
}
