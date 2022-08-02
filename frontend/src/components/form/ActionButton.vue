<script setup lang="ts">
import type {ButtonSize, ComponentVariant} from "@/types";

interface Props {
    variant: ComponentVariant;
    size: ButtonSize;
    icon: string;
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: "click"): void,
}>();

function onClick() {
    emit("click");
}
</script>

<template>
    <button :class="[size, variant]" @click="onClick">
        <i :class="['fa', `fa-${icon}`]" aria-hidden="true"/>
        <slot></slot>
    </button>
</template>

<style scoped lang="scss">
@import "../../scss/variables";

button {
    margin: 0.3em;

    padding: $button-padding;
    border-radius: $button-border-radius;
    border-width: $button-border-width;
    border-style: $button-border-style;

    cursor: pointer;

    font-weight: 600;

    @each $variant, $color in $variant-colors {
        &.#{$variant} {
            background-color: $color;
            border-color: $color;
            color: map-get($variant-text-colors, $variant);

            &:hover, &:active {
                background-color: $page-background-color;
                border-color: $color;
                color: $color;
            }

            &:focus {
                background-color: $color;
                border-color: $page-background-color;
                color: map-get($variant-text-colors, $variant);
                outline: $color solid $button-outline-width;
            }
        }
    }

    @each $size, $font-size in $button-sizes {
        &.#{$size} {
            font-size: $font-size;
        }
    }
}
</style>
