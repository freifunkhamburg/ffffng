<script setup lang="ts">
import Spinner from "@/components/Spinner.vue";

const props = defineProps({
    loading: {
        type: Boolean,
        required: true,
    }
});
</script>

<template>
    <div :class="{ 'loading-container': true, loading: loading }">
        <Spinner class="spinner" v-if="loading" />
        <div class="content" v-if="!loading">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "../scss/variables";

.loading-container {
    position: relative;

    padding: 0;
    margin: 0;

    &.loading {
        height: 10em;
    }
}

</style>
