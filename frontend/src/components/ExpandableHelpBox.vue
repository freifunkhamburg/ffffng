<script setup lang="ts">
import { ref } from "vue";

interface Props {
    text: string;
}

const props = defineProps<Props>();
const expanded = ref(false);

function toggleExpansion() {
    expanded.value = !expanded.value;
}
</script>

<template>
    <i
        class="fa fa-question-circle help-icon"
        @click.prevent="toggleExpansion"
        aria-hidden="true"
        title="Hilfe"
    />
    <p v-if="expanded" class="help-text">
        {{ props.text }}
    </p>
</template>

<style lang="scss" scoped>
@import "../scss/variables";

.help-icon {
    color: $help-icon-color;
    cursor: pointer;
}

.help-text {
    margin: $help-text-margin;
    font-weight: normal;
}
</style>
