<script setup lang="ts">
import type {ButtonSize} from "@/types";

interface Props {
    buttonSize: ButtonSize;
}

const props = defineProps<Props>()
</script>

<template>
    <div :class="['button-group', buttonSize]">
        <slot></slot>
    </div>
</template>

<style lang="scss">
@import "../../scss/variables";
@import "../../scss/mixins";

.button-group {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;

    button {
        margin: $button-margin;
    }
}

@include max-page-breakpoint(smaller) {
    .button-group {
        flex-direction: column;

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
