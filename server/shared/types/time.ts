/**
 * Contains types and type guards for "wibbly wobbly timey wimey" stuff.
 */
import { toIsNewtype } from "./newtypes";
import { isNumber } from "./primitives";

/**
 * Duration of a period of time in seconds.
 */
export type DurationSeconds = number & { readonly __tag: unique symbol };

/**
 * UnixTimestampMilliseconds}.
 *
 * @param arg - Value to check.
 */
export const isDurationSeconds = toIsNewtype(isNumber, NaN as DurationSeconds);

/**
 * Duration of a period of time in milliseconds.
 */
export type DurationMilliseconds = number & { readonly __tag: unique symbol };

/**
 * Type guard for {@UnixTimestampMilliseconds}.
 *
 * @param arg - Value to check.
 */
export const isDurationMilliseconds = toIsNewtype(
    isNumber,
    NaN as DurationMilliseconds
);

/**
 * Timestamp representing a point in time specified by the number of seconds passed
 * since the 1970-01-01 at 0:00:00 UTC.
 */
export type UnixTimestampSeconds = number & { readonly __tag: unique symbol };

/**
 * Type guard for {@UnixTimestampMilliseconds}.
 *
 * @param arg - Value to check.
 */
export const isUnixTimestampSeconds = toIsNewtype(
    isNumber,
    NaN as UnixTimestampSeconds
);

/**
 * Timestamp representing a point in time specified by the number of milliseconds passed
 * since the 1970-01-01 at 0:00:00 UTC.
 */
export type UnixTimestampMilliseconds = number & {
    readonly __tag: unique symbol;
};

/**
 * Type guard for {@link UnixTimestampMilliseconds}.
 *
 * @param arg - Value to check.
 */
export const isUnixTimestampMilliseconds = toIsNewtype(
    isNumber,
    NaN as UnixTimestampMilliseconds
);
