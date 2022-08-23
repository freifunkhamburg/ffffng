<script setup lang="ts">
import { onMounted, ref } from "vue";

const element = ref<HTMLElement>();

function scrollIntoView() {
    element.value?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
    });
}

onMounted(scrollIntoView);
</script>

<template>
    <div ref="element" class="error-card">
        <slot></slot>
    </div>
</template>

<style lang="scss">
@import "../scss/variables";

.error-card {
    margin: $error-card-margin;
    padding: $error-card-padding;

    border: $error-card-border;
    border-radius: $error-card-border-radius;

    font-weight: $error-card-font-weight;

    background-color: $error-card-background-color;
    color: $error-card-color;

    a {
        color: $error-card-link-color;

        &:hover {
            color: $error-card-link-hover-color;
        }

        &:focus {
            outline: $error-card-link-focus-outline;
        }
    }
}
</style>
