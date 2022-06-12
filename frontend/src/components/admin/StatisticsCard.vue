<script setup lang="ts">
import {computed, defineProps} from "vue";
import type {NodesFilter} from "@/types";

interface Props {
    title: string;
    icon: string;
    variant: string;
    value: number;
    link: string;
    filter?: NodesFilter;
}

const props = defineProps<Props>();

const linkTarget = computed(() => {
    if (props.filter) {
        return {
            path: props.link,
            query: props.filter,
        }
    } else {
        return props.link;
    }
});
</script>

<template>
    <RouterLink :to="linkTarget" :class="['statistics-card', 'statistics-card-' + variant]">
        <i :class="['fa', 'fa-' + icon]" aria-hidden="true" />
        <dl>
            <dt>{{ title }}</dt>
            <dd>{{ value }}</dd>
        </dl>
    </RouterLink>
</template>

<style lang="scss" scoped>
@import "../../scss/variables";

.statistics-card {
    display: flex;

    min-height: $statistics-card-height;

    margin: $statistics-card-margin;
    padding: $statistics-card-padding;

    border-radius: $statistics-card-border-radius;

    @each $variant, $color in $variant-colors {
        &.statistics-card-#{$variant} {
            background-color: $color;
            color: map-get($variant-text-colors, $variant);
        }
    }

    i {
        display: inline-block;
        margin-right: $statistics-card-icon-gap;
        font-size: $statistics-card-icon-size;
        width: 1em;
        text-align: center;
    }

    dl {
        position: relative;
        flex-grow: 1;

        box-sizing: border-box;

        height: 100%;
        margin: 0;

        text-align: right;

        dt {
            position: absolute;
            bottom: 0;
            right: 0;
        }

        dd {
            position: absolute;
            top: 0;
            right: 0;

            font-weight: bold;
            font-size: $statistics-card-value-font-size;
        }
    }
}
</style>
