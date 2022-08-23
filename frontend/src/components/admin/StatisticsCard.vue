<script setup lang="ts">
import {computed, defineProps} from "vue";
import type {ComponentVariant, NodesFilter} from "@/types";
import type {RouteName} from "@/router";
import router, {route} from "@/router";

interface Props {
    title: string;
    icon: string;
    variant: ComponentVariant;
    value: number;
    route: RouteName;
    filter?: NodesFilter;
}

const props = defineProps<Props>();

const linkTarget = computed(() => {
    const query = props.filter && {
        filter: JSON.stringify(props.filter),
    };
    return route(props.route, query);
});
</script>

<template>
    <RouterLink :to="linkTarget" :class="['statistics-card', 'statistics-card-' + variant]">
        <i :class="['fa', 'fa-' + icon]" aria-hidden="true"/>
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
    border-width: 0.2em;
    border-style: solid;

    @each $variant, $color in $variant-colors {
        &.statistics-card-#{$variant} {
            background-color: $color;
            color: map-get($variant-text-colors, $variant);
            border-color: $color;

            &:focus {
                border-color: $page-background-color;
                outline: 0.2em solid $color;
            }
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
