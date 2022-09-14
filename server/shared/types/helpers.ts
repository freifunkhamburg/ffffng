/**
 * Contains helper types and type guards.
 */

import { isNull, isUndefined } from "./primitives";

/**
 * Shorthand type alias for type guards checking for values of type `<ValueType>`.
 */
export type TypeGuard<ValueType> = (arg: unknown) => arg is ValueType;

/**
 * Shorthand type alias for referencing values hold by an object of type `<Type>`.
 *
 * See it as an addition to typescript's `keyof`.
 */
export type ValueOf<Type> = Type[keyof Type];

/**
 * Generic type guard to check for optional values of type `<Type>`.
 * Optional means the value must either be `undefined` or a valid value of type `<Type>`.
 *
 * @param arg - Value to check
 * @param isType - Type guard for checking for values of type `<Type>`
 */
export function isOptional<Type>(
    arg: unknown,
    isType: TypeGuard<Type>
): arg is Type | undefined {
    return isUndefined(arg) || isType(arg);
}

/**
 * Generic type guard to check for nullable values of type `<Type>`.
 * The value must either be `null` or a valid value of type `<Type>`.
 *
 * @param arg - Value to check
 * @param isType - Type guard for checking for values of type `<Type>`
 */
export function isNullable<Type>(
    arg: unknown,
    isType: TypeGuard<Type>
): arg is Type | null {
    return isNull(arg) || isType(arg);
}
