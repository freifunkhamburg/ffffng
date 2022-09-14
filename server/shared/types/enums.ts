/**
 * Contains type guards and helpers for enums.
 */
import type { TypeGuard, ValueOf } from "./helpers";

/**
 * Shorthand type alias for enum {@link TypeGuard}s.
 */
export type EnumTypeGuard<E> = TypeGuard<ValueOf<E>>;

/**
 * Shorthand type for descrbing enum objects.
 */
export type Enum<E> = Record<keyof E, ValueOf<E>>;

/**
 * Helper function to construct enum type guards.
 *
 * @param enumDef - The enum object to check against.
 * @returns A type guard for values of the enum `<Enum>`
 */
export function toIsEnum<E extends Enum<E>>(enumDef: E): EnumTypeGuard<E> {
    return (arg): arg is ValueOf<E> =>
        Object.values(enumDef).includes(arg as [keyof E]);
}
