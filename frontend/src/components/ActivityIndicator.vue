<script setup lang="ts"></script>

<template>
    <div class="spinner-container">
        <div class="spinner">
            <i class="fa fa-refresh fa-spin fa-3x" aria-hidden="true" />
            <span class="sr-only">Lädt...</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "../scss/variables";

.spinner-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    color: $page-text-color;
}
</style>
