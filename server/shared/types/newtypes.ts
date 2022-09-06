/**
 * Contains type guards for newtypes. Newtypes are a way to strongly type strings, numbers, ...
 *
 * This is inspired by the tagged intersection types in
 * {@link https://kubyshkin.name/posts/newtype-in-typescript/}.
 *
 * Also holds newtype definitions that don't fit elsewhere.
 */
import { TypeGuard } from "./helpers";
import { isString } from "./primitives";

// =====================================================================================================================
// General newtype helpers.
// =====================================================================================================================

/**
 * Helper function to generate type guards for newtypes of type `<Newtype>`.
 *
 * Newtypes can be defined as follows:
 *
 * @param isValue - Typeguard to check for the value-type (`<ValueType>`) of the newtype.
 * @param example - An example value of type `<Newtype>`.
 * @returns A type guard for `<Newtype>`.
 *
 * @example
 * type StringNewtype = string & { readonly __tag: unique symbol };
 * const isStringNewtype =  toIsNewtype(isString, "" as StringNewtype);
 *
 * type NumberNewtype = number & { readonly __tag: unique symbol };
 * const isNumberNewtype =  toIsNewtype(isNumber, NaN as NumberNewtype);
 */
// noinspection JSUnusedLocalSymbols
export function toIsNewtype<
    Newtype extends ValueType & { readonly __tag: symbol },
    ValueType
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(isValue: TypeGuard<ValueType>, example: Newtype): TypeGuard<Newtype> {
    return (arg: unknown): arg is Newtype => isValue(arg);
}

// =====================================================================================================================
// Newtype definitions.
// =====================================================================================================================

/**
 * Version of ffffng.
 */
export type Version = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Version}.
 *
 * @param arg - Value to check.
 */
export const isVersion = toIsNewtype(isString, "" as Version);

/**
 * Typesafe string representation of URLs.
 *
 * Note: Not to be confused with Javascript's own {@link URL} type.
 */
export type Url = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Url}.
 *
 * @param arg - Value to check.
 */
export const isUrl = toIsNewtype(isString, "" as Url);

/**
 * Fastd VPN key of a Freifunk node. This is the key used by the node to open a VPN tunnel to Freifunk gateways.
 */
export type FastdKey = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link FastdKey}.
 *
 * @param arg - Value to check.
 */
export const isFastdKey = toIsNewtype(isString, "" as FastdKey);

/**
 * A MAC address.
 */
export type MAC = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link MAC}.
 *
 * @param arg - Value to check.
 */
export const isMAC = toIsNewtype(isString, "" as MAC);

/**
 * String representing geo coordinates. Latitude and longitude are delimited by exactly one whitespace.
 * E.g.: <code>"53.565278 10.001389"</code>
 */
export type Coordinates = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Coordinates}.
 *
 * @param arg - Value to check.
 */
export const isCoordinates = toIsNewtype(isString, "" as Coordinates);

/**
 * String representation of contact's name / nickname.
 */
export type Nickname = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Nickname}.
 *
 * @param arg - Value to check.
 */
export const isNickname = toIsNewtype(isString, "" as Nickname);

/**
 * Freifunk site as specified in the community map's `nodes.json`.
 */
export type Site = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Site}.
 *
 * @param arg - Value to check.
 */
export const isSite = toIsNewtype(isString, "" as Site);

/**
 * Freifunk domain as specified in the community map's `nodes.json`.
 */
export type Domain = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Domain}.
 *
 * @param arg - Value to check.
 */
export const isDomain = toIsNewtype(isString, "" as Domain);
