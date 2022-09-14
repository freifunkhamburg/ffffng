/**
 * Utility functions for "wibbly wobbly timey wimey" stuff.
 */
import type { UnixTimestampMilliseconds, UnixTimestampSeconds } from "../types";

/**
 * Converts an {@link UnixTimestampMilliseconds} to an {@link UnixTimestampSeconds} rounding down.
 *
 * @param ms - The timestamp in milliseconds.
 * @returns - The timestamp in seconds.
 */
export function toUnixTimestampSeconds(
    ms: UnixTimestampMilliseconds
): UnixTimestampSeconds {
    return Math.floor(ms / 1000) as UnixTimestampSeconds;
}

/**
 * Converts an {@link UnixTimestampSeconds} to an {@link UnixTimestampMilliseconds}.
 *
 * @param s - The timestamp in seconds.
 * @returns - The timestamp in milliseconds.
 */
export function toUnixTimestampMilliseconds(
    s: UnixTimestampSeconds
): UnixTimestampMilliseconds {
    return (s * 1000) as UnixTimestampMilliseconds;
}
