<script setup lang="ts">
import {computed, defineProps} from "vue";

const {
    title,
    icon,
    variant,
    value,
    link,
    filter,
} = defineProps({
    title: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    variant: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    filter: {
        type: Object,
        required: false,
    },
});

const linkTarget = computed(() => {
    if (filter) {
        const json = JSON.stringify(filter);
        return `${link}?search=${encodeURIComponent(json)}`;
    } else {
        return link;
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
