<script setup lang="ts">
</script>

<template>
    <div class="page-container">
        <div class="content">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "../../scss/variables";
@import "../../scss/mixins";

.page-container {
    display: flex;
    justify-content: center;
}

@each $breakpoint, $width in $page-container-widths {
    @include page-breakpoint($breakpoint) {
        .content {
            width: $width;
        }
    }
}
</style>
