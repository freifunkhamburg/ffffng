<script setup lang="ts">
import {RouterLink, RouterView} from "vue-router";
import PageHeader from "@/components/page/PageHeader.vue";
import PageFooter from "@/components/page/PageFooter.vue";
</script>

<template>
    <PageHeader />

    <main>
        <RouterView />
    </main>

    <PageFooter />
</template>

<style lang="scss">
@import "fork-awesome";
@import "scss/variables";

body {
    background-color: $page-background-color;
    color: $page-text-color;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    margin: 0;
}

main {
    padding: $page-padding;
}

a {
    color: $link-color;
    text-decoration: none;

    &:hover {
        color: $link-hover-color;
    }

    &:focus {
        outline: 0.1em solid $link-hover-color;
    }
}

button {
    padding: $button-padding;
    border-radius: $button-border-radius;
    border-width: $button-border-width;
    border-style: $button-border-style;

    cursor: pointer;

    @each $variant, $color in $variant-colors {
        &.#{$variant} {
            background-color: map-get($variant-text-colors, $variant);
            border-color: $color;
            color: $color;

            &:hover, &:active {
                background-color: $color;
                border-color: $color;
                color: map-get($variant-text-colors, $variant);
            }

            &:focus {
                background-color: $color;
                border-color: $page-background-color;
                color: map-get($variant-text-colors, $variant);
                outline: 0.1em solid $color;
            }
        }
    }
}
</style>
