<script setup lang="ts">
import type {ButtonSize, ComponentAlignment} from "@/types";

interface Props {
    buttonSize: ButtonSize;
    align: ComponentAlignment;
}

const props = defineProps<Props>()
</script>

<template>
    <div :class="['button-group', buttonSize, align]">
        <slot></slot>
    </div>
</template>

<style lang="scss">
@import "../../scss/variables";
@import "../../scss/mixins";

.button-group {
    display: flex;
    flex-wrap: wrap;
    margin: {
        left: -$button-margin;
        right: -$button-margin;
    }

    @each $align in (left, center, right) {
        &.#{$align} {
            justify-content: $align;
        }
    }

    button {
        margin: $button-margin;
    }
}

@include max-page-breakpoint(smaller) {
    .button-group {
        flex-direction: column;

        margin: {
            left: 0;
            right: 0;
        }

        button {
            margin: $button-margin 0;
            width: 100%;
        }
    }
}

@include page-breakpoint(smaller) {
    .button-group {
        align-items: center;

        button {
            flex-grow: 1;
            max-width: 80%;
        }
    }
}
</style>
