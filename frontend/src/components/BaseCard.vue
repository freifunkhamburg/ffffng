<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ComponentVariant } from "@/types";

interface Props {
    variant: ComponentVariant;
    icon: string;
    scrollIntoView: boolean;
}

const props = defineProps<Props>();
const element = ref<HTMLElement>();

function scrollIntoView() {
    element.value?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
    });
}

if (props.scrollIntoView) {
    onMounted(scrollIntoView);
}
</script>

<template>
    <div ref="element" :class="['card', props.variant]">
        <i :class="['icon', 'fa', `fa-${props.icon}`]" aria-hidden="true" />
        <slot />
    </div>
</template>

<style lang="scss">
@import "../scss/variables";

.card {
    position: relative;
    clear: both;

    min-height: $base-card-min-height;

    margin: $base-card-margin;
    padding: $base-card-padding;

    border: {
        width: $base-card-border-width;
        style: $base-card-border-style;
        radius: $base-card-border-radius;
    }

    font-weight: $base-card-font-weight;

    *:nth-child(2) {
        margin-top: 0;
    }

    *:last-child {
        margin-bottom: 0;
    }

    .icon {
        float: left;
        margin: $base-card-icon-margin;
        font-size: $base-card-icon-size;
    }

    a:focus {
        outline: {
            width: $base-card-link-focus-outline-width;
            style: $base-card-link-focus-outline-style;
        }
    }
}

@each $variant, $color in $variant-colors {
    .card.#{$variant} {
        border-color: $color;

        background-color: darken($color, 30%);
        color: lighten($color, 30%);

        a {
            color: darken($color, 30%);

            &:hover {
                color: darken($color, 30%);
            }

            &:focus {
                outline-color: darken($color, 30%);
            }
        }
    }
}
</style>
