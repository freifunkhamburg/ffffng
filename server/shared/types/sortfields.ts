/**
 * Contains helper types and type guards for sort fields.
 */
import { Enum, toIsEnum } from "./enums";
import { isString } from "./primitives";
import { TypeGuard } from "./helpers";

/**
 * Generic untyped sort field.
 */
export type GenericSortField = {
    value: string;
    readonly __tag: unique symbol;
};

/**
 * Helper to define sort field types that match an enum `<SortFieldEnum>` listing allowed values to a type
 * `<SortableType>` being indexed by those values.
 *
 * In short: If the enum values don't match the sortable type keys the compiler will complain.
 */
export type SortFieldFor<
    SortableType,
    SortFieldEnum extends keyof SortableType
> = keyof Pick<SortableType, SortFieldEnum>;

/**
 * Helper function to construct a type guard for sort fields.
 *
 * Generic type parameters:
 *
 * * `<SortableType>` - The type to sort.
 * * `<SortFieldEnum>` - The enum used to specify the field of `<SortableType>` to sort by.
 * * `<SortFieldEnumType>` - The `typeof` the `<SortFieldEnum>`.
 * * `<SortField>` - The type of the sort field.
 *
 * Warning: I could not get the compiler to ensure `<SortFieldEnum>` and `<SortFieldEnumType>` refer to the same enum!
 *
 * @param sortFieldEnumDef - Enum representing the allowed sort fields.
 * @returns A type guard for sort fields of type `<SortField>`.
 */
export function toIsSortField<
    SortableType,
    SortFieldEnum extends keyof SortableType,
    SortFieldEnumType extends Enum<SortFieldEnumType>,
    SortField extends SortFieldFor<SortableType, SortFieldEnum>
>(sortFieldEnumDef: SortFieldEnumType): TypeGuard<SortField> {
    return (arg: unknown): arg is SortField => {
        if (!isString(arg)) {
            return false;
        }
        return Object.values(sortFieldEnumDef).includes(arg as SortField);
    };
}

/**
 * Direction in which to sort.
 */
export enum SortDirection {
    /**
     * Sort in ascending order.
     */
    ASCENDING = "ASC",

    /**
     * Sort in descending order.
     */
    DESCENDING = "DESC",
}

/**
 * Type guard for {@link SortDirection}.
 *
 * @param arg - Value to check.
 */
export const isSortDirection = toIsEnum(SortDirection);
