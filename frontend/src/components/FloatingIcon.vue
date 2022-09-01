<script setup lang="ts">
import type { ComponentVariant } from "@/types";

interface Props {
    icon: string;
    variant: ComponentVariant;
}

const props = defineProps<Props>();
</script>

<template>
    <span :class="['floating-icon', props.variant]">
        <i :class="['fa', `fa-${props.icon}`]" aria-hidden="true" />
    </span>
</template>

<style scoped lang="scss">
@import "../scss/variables";

.floating-icon {
    display: block;
    float: left;
    margin: 0 0.5em 0.25em 0;

    i {
        font-size: 3em;
    }
}

@each $variant, $color in $variant-colors {
    .floating-icon.#{$variant} {
        color: $color;
    }
}
</style>
