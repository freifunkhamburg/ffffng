<script setup lang="ts">
import {RouterView} from "vue-router";
import PageHeader from "@/components/page/PageHeader.vue";
import PageFooter from "@/components/page/PageFooter.vue";
</script>

<template>
    <PageHeader/>

    <main>
        <RouterView/>
    </main>

    <PageFooter/>
</template>

<style lang="scss">
@import "fork-awesome";
@import "scss/variables";
@import "scss/mixins";

body {
    background-color: $page-background-color;
    color: $page-text-color;
    font-size: $page-font-size;
    font-family: $page-font-family;
    margin: 0;
}

main {
    padding-top: $page-padding-top;
    padding-bottom: $page-padding-bottom;

    @each $breakpoint, $padding in $page-paddings-horizontal {
        @include page-breakpoint($breakpoint) {
            & {
                padding-left: $padding;
                padding-right: $padding;
            }
        }
    }
}

a {
    color: $link-color;
    text-decoration: none;

    &:hover {
        color: $link-hover-color;
    }

    &:focus {
        outline: $link-focus-outline;
    }
}

h2 {
    font-size: $h2-font-size;
    margin: $h2-margin;
}

input {
    padding: $input-padding;
    border: none;
    border-radius: $input-border-radius;

    background-color: $input-background-color;
    color: $input-text-color;

    &::placeholder {
        color: $input-placeholder-color;
        opacity: $input-placeholder-opacity;
    }

    &:focus {
        outline: $input-outline;
        outline-offset: $input-outline-offset;
    }
}

fieldset {
    margin: $fieldset-margin;
    padding: $fieldset-padding;

    border: $fieldset-border;
    border-radius: $fieldset-border-radius;

    background-color: $fieldset-background-color;
}
</style>
