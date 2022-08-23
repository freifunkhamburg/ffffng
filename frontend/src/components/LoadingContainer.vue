<script setup lang="ts">
import ActivityIndicator from "@/components/ActivityIndicator.vue";

const props = defineProps({
    loading: {
        type: Boolean,
        required: true,
    },
});
</script>

<template>
    <div :class="{ 'loading-container': true, loading: props.loading }">
        <ActivityIndicator v-if="props.loading" />
        <div class="content" v-if="!props.loading">
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
