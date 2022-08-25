<script lang="ts">
import { type Component, defineComponent, type PropType } from "vue";
import { type ValueOf, SortDirection } from "@/types";

type Props<SortField> = {
    field: PropType<ValueOf<SortField>>;
    currentField: PropType<ValueOf<SortField>>;
    currentDirection: PropType<SortDirection>;
};

type SortTH<SortField> = Component<Props<SortField>>;

function defineGenericComponent<SortField>(): SortTH<SortField> {
    const props: Props<SortField> = {
        field: null as unknown as PropType<ValueOf<SortField>>,
        currentField: null as unknown as PropType<ValueOf<SortField>>,
        currentDirection: null as unknown as PropType<SortDirection>,
    };
    return defineComponent({
        name: "SortTH",
        props,
        computed: {
            sortDirection: function () {
                return this.field === this.currentField
                    ? this.currentDirection
                    : undefined;
            },
            isAscending: function () {
                return this.sortDirection === SortDirection.ASCENDING;
            },
        },
        emits: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            sort: (field: SortField, direction: SortDirection) => true,
        },
        methods: {
            onClick(): void {
                this.$emit(
                    "sort",
                    this.field,
                    this.isAscending
                        ? SortDirection.DESCENDING
                        : SortDirection.ASCENDING
                );
            },
        },
    });
}

const component = defineGenericComponent<unknown>();

// eslint-disable-next-line no-redeclare
export function SortTH<SortField>(): SortTH<SortField> {
    return component as SortTH<SortField>;
}

// noinspection JSUnusedGlobalSymbols
export default component;
</script>

<template>
    <th>
        <a href="javascript:" title="Sortieren" @click="onClick">
            <slot />
            <i v-if="sortDirection && isAscending" class="fa fa-chevron-down" />
            <i v-if="sortDirection && !isAscending" class="fa fa-chevron-up" />
        </a>
    </th>
</template>

<style lang="scss" scoped>
@import "../../scss/variables";
</style>
